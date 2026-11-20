"""
certificate_rules.py - deterministic consistency checks for AP academic documents.

Works on EXTRACTED FIELDS (not pixels), so a clean scan, a phone photo and a PDF
all get the same verdict once OCR has read the same numbers.

Verdicts
  valid         every required field was read and every rule passed
  needs_review  something could not be read (never reported as tampering)
  suspicious    fields were read, but numbers contradict each other

"valid" here means internally consistent. Only the issuing board/university
can confirm a certificate is genuine.
"""
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
import re

DIGITS = {"ZERO": 0, "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4,
          "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9}
GRADE_POINTS = {"O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "P": 4, "F": 0}


@dataclass
class Check:
    id: str
    passed: bool
    detail: str


def words_to_number(words):
    """'FIVE NINE SIX' -> 596, '*NINE**THREE***NINE*' -> 939. None if unreadable."""
    tokens = re.sub(r"[^A-Za-z]+", " ", words or "").upper().split()
    if not tokens or any(t not in DIGITS for t in tokens):
        return None
    return int("".join(str(DIGITS[t]) for t in tokens))


def _d(x):
    return Decimal(str(x))


def _words_check(check_id, figure, words):
    if words in (None, ""):
        return None  # not provided -> not checked
    n = words_to_number(words)
    if n is None:
        return Check(check_id, False, f"could not read words '{words}'")
    return Check(check_id, n == figure, f"words={n}, figures={figure}")


# ---------------------------------------------------------------- SSC
def check_ssc(f):
    """f: marks[6], grand_total, total_words, roll_no, subject_words[6] (optional)"""
    out, marks = [], f.get("marks") or []
    out.append(Check("ssc_six_subjects", len(marks) == 6, f"{len(marks)} subjects read"))
    out.append(Check("ssc_marks_range", all(0 <= m <= 100 for m in marks), str(marks)))
    out.append(Check("ssc_sum_matches_total", sum(marks) == f.get("grand_total"),
                     f"sum={sum(marks)}, printed={f.get('grand_total')}"))
    c = _words_check("ssc_total_words", f.get("grand_total"), f.get("total_words"))
    if c: out.append(c)
    for i, w in enumerate(f.get("subject_words") or []):
        if i < len(marks):
            c = _words_check(f"ssc_subject_{i+1}_words", marks[i], w)
            if c: out.append(c)
    out.append(Check("ssc_roll_format", bool(re.fullmatch(r"\d{10}", f.get("roll_no") or "")),
                     f"roll_no={f.get('roll_no')}"))
    return out


# ---------------------------------------------------------------- Inter
def check_inter(f):
    """f: year1[(max,secured)...], year2[...], grand_total, total_words, reg_no"""
    out = []
    all_rows = (f.get("year1") or []) + (f.get("year2") or [])
    out.append(Check("inter_rows_read", len(all_rows) > 0, f"{len(all_rows)} subject rows"))
    out.append(Check("inter_secured_le_max", all(0 <= s <= m for m, s in all_rows), "secured <= max"))
    total = sum(s for _, s in all_rows)
    out.append(Check("inter_sum_matches_total", total == f.get("grand_total"),
                     f"sum={total}, printed={f.get('grand_total')}"))
    c = _words_check("inter_total_words", f.get("grand_total"), f.get("total_words"))
    if c: out.append(c)
    out.append(Check("inter_total_le_max", total <= sum(m for m, _ in all_rows),
                     f"{total} of {sum(m for m, _ in all_rows)}"))
    out.append(Check("inter_reg_format", bool(re.fullmatch(r"\d{10}", f.get("reg_no") or "")),
                     f"reg_no={f.get('reg_no')}"))
    return out


# ---------------------------------------------------------------- Semester grade card
def check_semester(f):
    """f: subjects[(name, credits, grade, points)], total_credits, total_points, sgpa, register_no"""
    out, subs = [], f.get("subjects") or []
    out.append(Check("sem_subjects_read", len(subs) > 0, f"{len(subs)} subjects"))
    out.append(Check("sem_grades_valid", all(g in GRADE_POINTS for _, _, g, _ in subs),
                     ", ".join(g for _, _, g, _ in subs)))
    bad = [n for n, c, g, p in subs if g in GRADE_POINTS and _d(c) * GRADE_POINTS[g] != _d(p)
           and not (_d(c) == 0 and _d(p) == 0)]
    out.append(Check("sem_points_equal_credits_x_grade", not bad,
                     "all subjects consistent" if not bad else f"mismatch: {bad}"))
    cr = sum(_d(c) for _, c, _, _ in subs)
    gp = sum(_d(p) for _, _, _, p in subs)
    out.append(Check("sem_credits_total", cr == _d(f.get("total_credits")), f"sum={cr}, printed={f.get('total_credits')}"))
    out.append(Check("sem_points_total", gp == _d(f.get("total_points")), f"sum={gp}, printed={f.get('total_points')}"))
    if cr > 0:
        sgpa = (gp / cr).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)  # 8.125 -> 8.13
        out.append(Check("sem_sgpa", sgpa == _d(f.get("sgpa")), f"computed={sgpa}, printed={f.get('sgpa')}"))
    out.append(Check("sem_register_format", bool(re.fullmatch(r"\d{12}", f.get("register_no") or "")),
                     f"register_no={f.get('register_no')}"))
    return out


CHECKERS = {"ssc": check_ssc, "inter": check_inter, "semester": check_semester}
REQUIRED = {
    "ssc": ["marks", "grand_total", "roll_no"],
    "inter": ["year1", "year2", "grand_total", "reg_no"],
    "semester": ["subjects", "total_credits", "total_points", "sgpa", "register_no"],
}


def verify(doc_type, fields):
    """Return {verdict, checks, missing}. Missing data -> needs_review, never suspicious."""
    missing = [k for k in REQUIRED[doc_type] if not fields.get(k)]
    if missing:
        return {"verdict": "needs_review", "missing": missing,
                "checks": [], "reason": "Could not read: " + ", ".join(missing)}
    checks = CHECKERS[doc_type](fields)
    failed = [c for c in checks if not c.passed]
    return {"verdict": "suspicious" if failed else "valid",
            "missing": [], "checks": checks,
            "reason": "; ".join(f"{c.id}: {c.detail}" for c in failed) or "All consistency checks passed"}
