import json
import os
import re
import sys


DOCUMENT_RULES = {
    "SSC_MARKS_MEMO": [
        (5, r"secondary\s+school\s+certificate"),
        (4, r"board\s+of\s+secondary\s+education"),
        (3, r"\bssc\b"),
        (3, r"memorandum\s+of\s+marks"),
        (2, r"10th\s+class|tenth\s+class"),
        (2, r"first\s+language"),
        (2, r"second\s+language"),
        (1, r"third\s+language"),
        (1, r"general\s+science"),
        (1, r"social\s+studies")
    ],

    "INTER_MARKS_MEMO": [
        (6, r"board\s+of\s+intermediate\s+education"),
        (5, r"intermediate\s+public\s+examination"),
        (5, r"intermediate\s+pass\s+certificate"),
        (4, r"pass\s+certificate\s+cum\s+memorandum\s+of\s+marks"),
        (4, r"\bintermediate\b"),
        (3, r"\bipe\b"),
        (3, r"intermediate\s+education"),
        (3, r"registered\s*(number|no)|regd\.?\s*(number|no)"),
        (2, r"first\s+year"),
        (2, r"second\s+year"),
        (2, r"marks\s+secured"),
        (2, r"grand\s+total"),
        (2, r"part\s*[- ]?\s*(i|ii|1|2|a|b)"),
        (1, r"hall\s*ticket"),
        (1, r"practicals?"),
        (1, r"environmental\s+education"),
        (1, r"ethics.*human\s+values")
    ],

    "SEMESTER_RESULT": [
        (6, r"\bsgpa\b|s\.?\s*g\.?\s*p\.?\s*a\.?"),
        (6, r"\bcgpa\b|c\.?\s*g\.?\s*p\.?\s*a\.?"),
        (5, r"grade\s+card"),
        (4, r"semester\s+end\s+examinations?"),
        (4, r"\bsemester\b"),
        (3, r"subject\s+code"),
        (3, r"credits?"),
        (2, r"controller\s+of\s+examinations"),
        (2, r"register\s*(number|no)"),
        (1, r"b\.?\s*tech|bachelor\s+of\s+technology"),
        (1, r"university")
    ]
}


def normalize_text(text):
    """Normalize OCR text for more tolerant keyword matching."""
    text = (text or "").upper()
    text = text.replace("\r", " ")
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def find_rule_matches(text, rules):
    """Calculate score and list all matching classification rules."""
    score = 0
    matches = []

    for weight, pattern in rules:
        if re.search(pattern, text, re.IGNORECASE):
            score += weight
            matches.append({
                "pattern": pattern,
                "weight": weight
            })

    return score, matches


def has_intermediate_combination(text):
    """
    Detect Inter documents where the board name is OCR-damaged but
    other strong Intermediate certificate terms survive.
    """
    has_intermediate = bool(
        re.search(r"\bINTERMEDIATE\b", text)
    )

    has_pass_certificate = bool(
        re.search(r"PASS\s+CERTIFICATE", text)
    )

    has_registered_number = bool(
        re.search(
            r"REGISTERED\s*(NUMBER|NO)|REGD\.?\s*(NUMBER|NO)",
            text
        )
    )

    has_memo = bool(
        re.search(r"MEMORANDUM\s+OF\s+MARKS", text)
    )

    has_inter_subjects = bool(
        re.search(
            r"MATHEMATICS\s*[- ]?[AB]|PHYSICS|CHEMISTRY|"
            r"PRACTICALS?|ENVIRONMENTAL\s+EDUCATION",
            text
        )
    )

    strong_signals = sum([
        has_pass_certificate,
        has_registered_number,
        has_memo,
        has_inter_subjects
    ])

    return has_intermediate and strong_signals >= 2


def has_ssc_combination(text):
    """Detect SSC documents using certificate/subject terms together."""
    has_secondary_certificate = bool(
        re.search(
            r"SECONDARY\s+SCHOOL\s+CERTIFICATE",
            text
        )
    )

    has_ssc = bool(
        re.search(r"\bSSC\b", text)
    )

    has_ssc_subjects = bool(
        re.search(
            r"FIRST\s+LANGUAGE|SECOND\s+LANGUAGE|"
            r"THIRD\s+LANGUAGE|SOCIAL\s+STUDIES|"
            r"GENERAL\s+SCIENCE",
            text
        )
    )

    return (
        has_secondary_certificate
        or (has_ssc and has_ssc_subjects)
    )


def has_semester_combination(text):
    """Require academic-semester signals, not just a controller title."""
    has_semester = bool(
        re.search(r"\bSEMESTER\b", text)
    )

    has_gpa = bool(
        re.search(
            r"\bSGPA\b|\bCGPA\b|"
            r"S\.?\s*G\.?\s*P\.?\s*A\.?|"
            r"C\.?\s*G\.?\s*P\.?\s*A\.?",
            text
        )
    )

    has_credits_or_subject_codes = bool(
        re.search(r"CREDITS?|SUBJECT\s+CODE", text)
    )

    has_grade_card = bool(
        re.search(r"GRADE\s+CARD", text)
    )

    return (
        has_grade_card
        or has_gpa
        or (has_semester and has_credits_or_subject_codes)
    )


def classify_document(raw_text, reconstructed_text=None):
    """
    Classify OCR result as SSC_MARKS_MEMO, INTER_MARKS_MEMO,
    SEMESTER_RESULT, or UNKNOWN.
    """
    combined_text = (
        f"{raw_text or ''} {reconstructed_text or ''}"
    )

    text = normalize_text(combined_text)

    all_scores = {}

    for doc_type, rules in DOCUMENT_RULES.items():
        score, matches = find_rule_matches(text, rules)

        all_scores[doc_type] = {
            "score": score,
            "matched_keywords": matches
        }

    if has_intermediate_combination(text):
        all_scores["INTER_MARKS_MEMO"]["score"] += 8
        all_scores["INTER_MARKS_MEMO"][
            "matched_keywords"
        ].append({
            "pattern": "intermediate_certificate_combination",
            "weight": 8
        })

    if has_ssc_combination(text):
        all_scores["SSC_MARKS_MEMO"]["score"] += 5
        all_scores["SSC_MARKS_MEMO"][
            "matched_keywords"
        ].append({
            "pattern": "ssc_certificate_combination",
            "weight": 5
        })

    if has_semester_combination(text):
        all_scores["SEMESTER_RESULT"]["score"] += 5
        all_scores["SEMESTER_RESULT"][
            "matched_keywords"
        ].append({
            "pattern": "semester_result_combination",
            "weight": 5
        })

    best_type = "UNKNOWN"
    best_score = 0
    best_matches = []

    for doc_type, result in all_scores.items():
        score = result["score"]

        if score > best_score:
            best_type = doc_type
            best_score = score
            best_matches = result["matched_keywords"]

    minimum_scores = {
        "SSC_MARKS_MEMO": 5,
        "INTER_MARKS_MEMO": 5,
        "SEMESTER_RESULT": 6
    }

    if best_score < minimum_scores.get(best_type, 999):
        best_type = "UNKNOWN"

    if best_type == "UNKNOWN":
        confidence = 0.0
    else:
        confidence = round(
            min(best_score / 12, 1.0),
            2
        )

    return {
        "doc_type": best_type,
        "confidence": confidence,
        "raw_score": best_score,
        "matched_keywords": best_matches,
        "all_scores": all_scores
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        ocr_json_path = sys.argv[1]
    else:
        ocr_json_path = (
            "ocr_results/my_test_image_page_0_ocr.json"
        )

    with open(ocr_json_path, "r", encoding="utf-8") as file:
        ocr_data = json.load(file)

    result = classify_document(
        ocr_data.get("raw_text", ""),
        ocr_data.get("reconstructed_text", "")
    )

    base_name = os.path.splitext(
        os.path.basename(ocr_json_path)
    )[0]

    os.makedirs("classification_results", exist_ok=True)

    output_path = os.path.join(
        "classification_results",
        f"{base_name}_classified.json"
    )

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(result, file, indent=2)

    print(f"Saved classification result to: {output_path}")
    print(json.dumps(result, indent=2))