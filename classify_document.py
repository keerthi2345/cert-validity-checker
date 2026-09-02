import json
import os
import re
import sys


DOCUMENT_RULES = {
    "SSC_MARKS_MEMO": [
        (4, r"secondary\s+school\s+certificate"),
        (4, r"board\s+of\s+secondary\s+education"),
        (3, r"\bssc\b"),
        (3, r"memorandum\s+of\s+marks"),
        (2, r"10th\s+class|tenth\s+class"),
        (1, r"general\s+science"),
        (1, r"social\s+studies"),
        (1, r"first\s+language"),
        (1, r"second\s+language")
    ],

    "INTER_MARKS_MEMO": [
        (5, r"board\s+of\s+intermediate\s+education"),
        (4, r"intermediate\s+public\s+examination"),
        (3, r"\bipe\b"),
        (3, r"intermediate\s+education"),
        (2, r"first\s+year"),
        (2, r"second\s+year"),
        (2, r"marks\s+secured"),
        (2, r"grand\s+total"),
        (1, r"hall\s*ticket"),
        (1, r"registered\s+number|regd\.?\s*no")
    ],

    "SEMESTER_RESULT": [
        (5, r"\bsgpa\b|s\.?\s*g\.?\s*p\.?\s*a\.?"),
        (5, r"\bcgpa\b|c\.?\s*g\.?\s*p\.?\s*a\.?"),
        (4, r"controller\s+of\s+examinations"),
        (4, r"grade\s+card"),
        (3, r"semester"),
        (3, r"semester\s+end\s+examinations?"),
        (2, r"subject\s+code"),
        (2, r"register\s*(number|no)"),
        (2, r"credits?"),
        (1, r"b\.?\s*tech|bachelor\s+of\s+technology"),
        (1, r"university")
    ]
}


def normalize_text(text):
    """Normalize OCR text so keyword matching is more tolerant."""
    text = text.upper()
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def classify_document(raw_text, reconstructed_text=None):
    """
    Classify an OCR result into:
    SSC_MARKS_MEMO, INTER_MARKS_MEMO, SEMESTER_RESULT, or UNKNOWN.
    """
    combined_text = f"{raw_text or ''} {reconstructed_text or ''}"
    text = normalize_text(combined_text)

    all_scores = {}
    best_type = "UNKNOWN"
    best_score = 0
    best_matches = []

    for doc_type, rules in DOCUMENT_RULES.items():
        score = 0
        matched_keywords = []

        for weight, pattern in rules:
            if re.search(pattern, text, re.IGNORECASE):
                score += weight
                matched_keywords.append({
                    "pattern": pattern,
                    "weight": weight
                })

        all_scores[doc_type] = {
            "score": score,
            "matched_keywords": matched_keywords
        }

        if score > best_score:
            best_score = score
            best_type = doc_type
            best_matches = matched_keywords

    minimum_scores = {
        "SSC_MARKS_MEMO": 4,
        "INTER_MARKS_MEMO": 5,
        "SEMESTER_RESULT": 5
    }

    if best_score < minimum_scores.get(best_type, 999):
        best_type = "UNKNOWN"

    confidence = round(min(best_score / 12, 1.0), 2) if best_type != "UNKNOWN" else 0.0

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
        ocr_json_path = "ocr_results/my_test_image_page_0_ocr.json"

    with open(ocr_json_path, "r", encoding="utf-8") as file:
        ocr_data = json.load(file)

    result = classify_document(
        ocr_data.get("raw_text", ""),
        ocr_data.get("reconstructed_text", "")
    )

    base_name = os.path.splitext(os.path.basename(ocr_json_path))[0]
    os.makedirs("classification_results", exist_ok=True)

    output_path = os.path.join(
        "classification_results",
        f"{base_name}_classified.json"
    )

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(result, file, indent=2)

    print(f"Saved classification result to: {output_path}")
    print(json.dumps(result, indent=2))