import json
import sys
import os
import re

def extract_ssc_fields(reconstructed_text, raw_text):
    """Extract structured fields, trying reconstructed_text first, falling back to raw_text."""
    fields = {}

    word_to_digit = {
        "ZERO": "0", "ONE": "1", "TWO": "2", "THREE": "3", "FOUR": "4",
        "FIVE": "5", "SIX": "6", "SEVEN": "7", "EIGHT": "8", "NINE": "9"
    }

    patterns = {
        "name": r"CERTIFIED THAT\s+([A-Z\s]+?)(?:\n|FATHER)",
        "father_name": r"FATHER NAME\s*[:;]?\s*([A-Z\s]+?)(?:\n|AOTHER|MOTHER)",
        "mother_name": r"(?:MOTHER|AOTHER) NAME\s*[:;]?\s*([A-Z\s]+?)(?:\n|hearing|ROLL)",
        "roll_no": r"ROLL NO\.?,?\s*[:;]?\s*(\d+)",
        "date_of_birth": r"DATE OF BIRTH\s+(\d{2}/\d{2}/\d{4})",
        "exam_year": r"held in\s+\w+\s+(\d{4})",
        "first_language_marks": r"FIRST\s+LANGUAGE.*?\)\s*(\d{2,3})",
        "second_language_marks": r"SECOND\s+LANGUAGE.*?\)\s*(\d{2,3})",
        "third_language_marks": r"THIRD\s+LANGUAGE.*?(\d{2,3})",
        "mathematics_marks": r"MATHEMATICS\D*?(\d{2,3})",
        "general_science_marks": r"GENERAL\s+SCIENCE\D*?(\d{2,3})",
        "social_studies_marks": r"SOCIAL\s+STUDIES\D*?(\d{2,3})"
    }

    for field_name, pattern in patterns.items():
        match = re.search(pattern, reconstructed_text, re.IGNORECASE | re.DOTALL)
        if not match:
            match = re.search(pattern, raw_text, re.IGNORECASE | re.DOTALL)

        if match:
            fields[field_name] = match.group(1).strip()
        else:
            fields[field_name] = None

    # Try digits first for grand_total, then fall back to word-form numbers
    digit_match = re.search(r"GRAND TOTAL\s*[:;]?\s*(\d{2,4})", reconstructed_text, re.IGNORECASE) or \
                  re.search(r"GRAND TOTAL\s*[:;]?\s*(\d{2,4})", raw_text, re.IGNORECASE)

    if digit_match:
        fields["grand_total"] = digit_match.group(1)
    else:
        word_match = re.search(
            r"GRAND TOTAL\s+((?:ZERO|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE)(?:\s+(?:ZERO|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE)){1,3})",
            reconstructed_text, re.IGNORECASE
        )
        if word_match:
            words = word_match.group(1).upper().split()
            fields["grand_total"] = "".join(word_to_digit[w] for w in words)
        else:
            fields["grand_total"] = None

    name_fields = ["name", "father_name", "mother_name"]
    for field_name in name_fields:
        if fields.get(field_name):
            words = fields[field_name].split()
            clean_words = []
            for word in words:
                if word.isupper():
                    clean_words.append(word)
                else:
                    break
            fields[field_name] = " ".join(clean_words) if clean_words else fields[field_name]

    return fields

def cross_field_validation(fields):
    """Basic sanity checks between extracted fields."""
    checks = {}

    # Check 1: age at exam
    if fields.get("date_of_birth") and fields.get("exam_year"):
        try:
            dob_year = int(fields["date_of_birth"].split("/")[-1])
            exam_year = int(fields["exam_year"])
            age_at_exam = exam_year - dob_year
            checks["age_at_exam_valid"] = 14 <= age_at_exam <= 20
            checks["age_at_exam"] = age_at_exam
        except (ValueError, IndexError):
            checks["age_at_exam_valid"] = None

    # Check 2: marks sum vs grand total
    subject_fields = [
        "first_language_marks", "second_language_marks", "third_language_marks",
        "mathematics_marks", "general_science_marks", "social_studies_marks"
    ]
    subject_marks = []
    for field_name in subject_fields:
        value = fields.get(field_name)
        if value is not None:
            try:
                subject_marks.append(int(value))
            except ValueError:
                pass

    if len(subject_marks) == len(subject_fields) and fields.get("grand_total"):
        try:
            calculated_sum = sum(subject_marks)
            stated_total = int(fields["grand_total"])
            checks["marks_sum_calculated"] = calculated_sum
            checks["marks_sum_matches_total"] = (calculated_sum == stated_total)
        except ValueError:
            checks["marks_sum_matches_total"] = None
    else:
        checks["marks_sum_matches_total"] = None
        checks["marks_fields_found"] = len(subject_marks)
        checks["marks_fields_expected"] = len(subject_fields)

    # Check 3: percentage math (assuming 6 subjects x 100 marks = 600 max)
    if fields.get("grand_total"):
        try:
            stated_total = int(fields["grand_total"])
            max_possible = 600
            calculated_percentage = round((stated_total / max_possible) * 100, 2)
            checks["calculated_percentage"] = calculated_percentage
        except (ValueError, ZeroDivisionError):
            checks["calculated_percentage"] = None

    return checks

if __name__ == "__main__":
    if len(sys.argv) > 1:
        ocr_json_path = sys.argv[1]
    else:
        ocr_json_path = "ocr_results/my_test_image_page_0_ocr.json"

    with open(ocr_json_path, "r", encoding="utf-8") as f:
        ocr_data = json.load(f)

    fields = extract_ssc_fields(ocr_data["reconstructed_text"], ocr_data["raw_text"])
    logic_check_result = cross_field_validation(fields)

    result = {
        "doc_type": "SSC_CERTIFICATE",
        "extracted_fields": fields,
        "logic_check_result": logic_check_result
    }

    base_name = os.path.splitext(os.path.basename(ocr_json_path))[0]
    os.makedirs("final_results", exist_ok=True)
    output_path = f"final_results/{base_name}_final.json"

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print(f"Saved final result to: {output_path}")
    print(json.dumps(result, indent=2))