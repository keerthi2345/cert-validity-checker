"""
Adapter between Person 4's forensics module (forensics_module/) and
Person 2's Celery task (backend/app/workers/tasks.py).

Keeps forensics_module/ fully independent and testable on its own —
this file is the only thing that knows both sides' expected formats.
"""

import sys
import traceback

# forensics_module/ lives as a sibling to backend/, not inside it
sys.path.append(r"D:\cert-validity-checker\forensics_module")
from pipeline import run_forensics


def _structural_score(structural):
    """Converts the 4 structural pass/fail checks into a 0-100 score."""
    checks = [
        structural["seal"]["seal_present"],
        structural["signature"]["signature_likely"],
        structural["font"]["consistent"],
        structural["letterhead"]["letterhead_likely"],
    ]
    passed = sum(1 for c in checks if c)
    return round((passed / len(checks)) * 100, 2)


def _forensics_score(ela_result, copy_move_result, metadata_result):
    """
    Converts ELA/copy-move/metadata signals into a 0-100 score.
    Copy-move and ELA are weighted heavier and hard-capped, matching the
    same "one strong red flag shouldn't be averaged away" logic used in
    scoring_engine.py — so this stays consistent with Person 4's own rules.
    """
    score = 100.0

    if copy_move_result["copy_move_detected"]:
        score = min(score, 40.0)
    if ela_result["suspicious_regions_present"]:
        score = min(score, 40.0)
    if metadata_result.get("suspicious") or metadata_result.get("modified_after_creation"):
        score -= 10.0

    return round(max(0.0, score), 2)


def run_forensics_pipeline(file_path, person3_result):
    """
    The function backend/app/workers/tasks.py imports and calls.

    Args:
        file_path: path to the uploaded document (PNG/JPEG/PDF)
        person3_result: Person 3's OCR/logic output, expected shape:
            {"doc_type": ..., "extracted_fields": {...}, "logic_check_result": "PASS"/"FAIL", "words": [...]}

    Returns:
        {"structural_score": float, "forensics_score": float,
         "forensic_result": dict, "explanation": str}

    Never raises — any failure (corrupt file, unreadable PDF, missing OCR
    words) is caught and returned as a low-confidence result instead of
    crashing the Celery task, so one bad upload can't take down the queue.
    """
    try:
        ocr_words = person3_result.get("words", []) if person3_result else []
        logic_check = (person3_result or {}).get("logic_check_result", {}) or {}
        logic_status = "PASS" if logic_check.get("overall_status") == "PASS" else "FAIL"
        logic_check_result = {"status": logic_status}

        result = run_forensics(file_path, ocr_words, logic_check_result)

        structural_score = _structural_score(result["structural_checks"])
        forensics_score = _forensics_score(result["ela"], result["copy_move"], result["metadata"])

        return {
            "structural_score": structural_score,
            "forensics_score": forensics_score,
            "forensic_result": result,
            "explanation": "; ".join(result["final_result"]["explanation"]),
        }

    except Exception as exc:
        # A failure here must not crash the whole verification pipeline —
        # flag it clearly instead so a human can review the document manually.
        return {
            "structural_score": 0.0,
            "forensics_score": 0.0,
            "forensic_result": {"error": str(exc), "traceback": traceback.format_exc()},
            "explanation": f"Forensics analysis failed to run: {exc}",
        }