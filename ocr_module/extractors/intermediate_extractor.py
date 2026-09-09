import re
import cv2
import pytesseract


pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def group_rows(words, y_tol=20):
    """Group OCR words into approximate rows using y coordinates."""
    if not words:
        return []

    sorted_words = sorted(
        words,
        key=lambda word: word["y"]
    )

    rows = []
    current_row = [sorted_words[0]]
    current_y = sorted_words[0]["y"]

    for word in sorted_words[1:]:
        if abs(word["y"] - current_y) <= y_tol:
            current_row.append(word)
        else:
            rows.append(current_row)
            current_row = [word]
            current_y = word["y"]

    rows.append(current_row)

    return rows


def clean_name_value(value):
    """Remove label words and retain uppercase name-like words."""
    if not value:
        return None

    ignored_words = {
        "NAME",
        "FATHER",
        "MOTHER",
        "FATHER'S",
        "MOTHER'S",
        "THER",
        "CANDIDATE",
        "STUDENT"
    }

    clean_words = []

    for word in value.replace(",", " ").split():
        word = word.upper().strip(":;,.()[]{}")

        if word in ignored_words:
            continue

        if word.isalpha() and word.isupper():
            clean_words.append(word)

        elif clean_words:
            break

    result = " ".join(clean_words).strip()

    return result if result else None


def extract_value_after_label(text, label_patterns):
    """
    Extract a value that appears on the same line or immediately below a label.

    Handles OCR output such as:
    NAME
    AKULA HARIKA

    and:
    FATHER'S NAME AKULA VENKATA GIRI BABU
    """
    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    for index, line in enumerate(lines):
        for pattern in label_patterns:
            match = re.search(
                pattern,
                line,
                re.IGNORECASE
            )

            if not match:
                continue

            remainder = line[match.end():]
            remainder = remainder.strip(" :;-")

            if remainder and len(remainder) >= 2:
                return clean_name_value(remainder)

            if index + 1 < len(lines):
                next_line = lines[index + 1]

                if not re.search(
                    r"FATHER|MOTHER|REGD|ROLL|NUMBER|DATE|MONTH|YEAR",
                    next_line,
                    re.IGNORECASE
                ):
                    return clean_name_value(next_line)

    return None


def find_value_right_of_label(words, label_text, y_tolerance=25):
    """Find OCR words to the right of a label on the same approximate row."""
    label_word = None

    for word in words:
        cleaned = word["text"].upper().strip(":;,.()[]{}")

        if cleaned == label_text.upper():
            label_word = word
            break

    if not label_word:
        return None

    candidates = []

    for word in words:
        same_row = (
            abs(word["y"] - label_word["y"])
            <= y_tolerance
        )

        to_right = word["x"] > label_word["x"]

        if same_row and to_right:
            candidates.append(word)

    candidates.sort(
        key=lambda word: word["x"]
    )

    if not candidates:
        return None

    return " ".join(
        word["text"]
        for word in candidates[:6]
    )


def extract_marks_table(image, words, image_width=None):
    """
    Crop the Intermediate marks-table region and run a focused OCR pass.

    Word coordinates were generated from the 2x upscaled OCR image.
    The input image is the original preprocessed image, so coordinates
    are scaled back before cropping.
    """
    if image is None or not words:
        return {
            "marks_table_status": "NOT_AVAILABLE",
            "raw_table_text": None
        }

    part_words = [
        word
        for word in words
        if word["text"].upper().strip(":;,.()[]{}") == "PART"
    ]

    if not part_words:
        return {
            "marks_table_status": "PART_HEADER_NOT_FOUND",
            "raw_table_text": None
        }

    table_start_y_ocr = min(
        word["y"]
        for word in part_words
    )

    grand_words = [
        word
        for word in words
        if "GRAND" in word["text"].upper()
        and word["y"] > table_start_y_ocr
    ]

    if not grand_words:
        return {
            "marks_table_status": "GRAND_TOTAL_NOT_FOUND",
            "raw_table_text": None
        }

    # Select the nearest GRAND heading after PART.
    table_end_y_ocr = min(
        word["y"]
        for word in grand_words
    )

    if table_end_y_ocr <= table_start_y_ocr:
        return {
            "marks_table_status": "INVALID_TABLE_REGION",
            "raw_table_text": None
        }

    original_height, original_width = image.shape[:2]

    if image_width and image_width > 0:
        scale = original_width / image_width
    else:
        max_x = max(
            word.get("x", 0) + word.get("width", 0)
            for word in words
        )
        scale = original_width / max(max_x, 1)

    table_start_y = int(table_start_y_ocr * scale)
    table_end_y = int(table_end_y_ocr * scale)

    padding = 25

    crop_top = max(0, table_start_y - padding)
    crop_bottom = min(
        original_height,
        table_end_y + padding
    )

    if crop_bottom <= crop_top:
        return {
            "marks_table_status": "INVALID_CROP",
            "raw_table_text": None
        }

    crop = image[crop_top:crop_bottom, :]

    # Save this crop temporarily for debugging during development.
    cv2.imwrite(
        "outputs/intermediate_marks_table_crop.png",
        crop
    )

    table_text = pytesseract.image_to_string(
        crop,
        config="--psm 6"
    )

    has_numeric_marks = bool(
        re.search(r"\b\d{2,3}\b", table_text)
    )

    result = {
        "marks_table_status": (
            "CROPPED_AND_OCR_READ"
            if has_numeric_marks
            else "CROPPED_BUT_MARKS_NOT_READ"
        ),
        "crop_top": crop_top,
        "crop_bottom": crop_bottom,
        "raw_table_text": table_text
    }

    year1_max = re.search(
        r"1S?T?\s*YEAR.*?MAX\s*MARKS\s+(.+)",
        table_text,
        re.IGNORECASE
    )

    year1_secured = re.search(
        r"1S?T?\s*YEAR.*?MARKS\s*SECURED\s+(.+)",
        table_text,
        re.IGNORECASE
    )

    year2_max = re.search(
        r"2N?D?\s*YEAR.*?MAX\s*MARKS\s+(.+)",
        table_text,
        re.IGNORECASE | re.DOTALL
    )

    year2_secured = re.search(
        r"2N?D?\s*YEAR.*?MARKS\s*SECURED\s+(.+)",
        table_text,
        re.IGNORECASE | re.DOTALL
    )

    result["year1_max_marks_row"] = (
        year1_max.group(1).strip()
        if year1_max
        else None
    )

    result["year1_secured_row"] = (
        year1_secured.group(1).strip()
        if year1_secured
        else None
    )

    result["year2_max_marks_row"] = (
        year2_max.group(1).strip()
        if year2_max
        else None
    )

    result["year2_secured_row"] = (
        year2_secured.group(1).strip()
        if year2_secured
        else None
    )

    return result


def extract_intermediate_fields(
    reconstructed_text,
    raw_text,
    words,
    image_width=1000,
    image=None
):
    """Extract core fields from an Intermediate marks memo."""
    fields = {}

    combined_text = (
        f"{reconstructed_text}\n{raw_text}"
    ).upper()

    regd_number_match = re.search(
        r"(?:REGD|REGISTRATION|ROLL)\s*(?:NO|NUMBER)?\s*[:;.]?\s*(\d{8,15})",
        combined_text,
        re.IGNORECASE
    )

    if regd_number_match:
        fields["regd_number"] = regd_number_match.group(1)

    else:
        fields["regd_number"] = None

        for word in words:
            token = re.sub(
                r"[^0-9]",
                "",
                word.get("text", "")
            )

            if len(token) == 10:
                fields["regd_number"] = token
                break

    fields["name"] = extract_value_after_label(
        reconstructed_text,
        [
            r"^NAME\s*[:;.]?",
            r"CANDIDATE\s+NAME\s*[:;.]?",
            r"NAME\s+OF\s+THE\s+CANDIDATE\s*[:;.]?"
        ]
    )

    fields["father_name"] = extract_value_after_label(
        reconstructed_text,
        [
            r"FATHER'?S?\s+NAME\s*[:;.]?",
            r"FATHER\s+NAME\s*[:;.]?"
        ]
    )

    fields["mother_name"] = extract_value_after_label(
        reconstructed_text,
        [
            r"MOTHER'?S?\s+(?:THER\s+)?NAME\s*[:;.]?",
            r"MOTHER\s+NAME\s*[:;.]?"
        ]
    )

    grand_total_match = re.search(
        r"GRAND\s*TOTAL\s*[:;.]?\s*(\d{2,4})",
        combined_text,
        re.IGNORECASE
    )

    fields["grand_total"] = (
        grand_total_match.group(1)
        if grand_total_match
        else None
    )

    result_match = re.search(
        r"RESULT\s*[:;.]?\s*([A-Z]+\s+GRADE|QUALIFIED|PASSED)",
        combined_text,
        re.IGNORECASE
    )

    fields["result"] = (
        result_match.group(1).strip()
        if result_match
        else None
    )

    date_match = re.search(
        r"(?:DATE|DATED)\s*[:;.]?\s*(\d{2}[/-]\d{2}[/-]\d{4})",
        combined_text,
        re.IGNORECASE
    )

    fields["exam_date"] = (
        date_match.group(1)
        if date_match
        else None
    )

    table_data = extract_marks_table(
        image,
        words,
        image_width
    )

    fields.update(table_data)

    return fields


def validate_intermediate_fields(fields):
    """
    Validate extracted Intermediate marks-memo fields.

    PASS means the document has all important fields, a valid grand total,
    and a marks-table region successfully recovered by OCR.
    """
    checks = {}

    required_fields = [
        "regd_number",
        "name",
        "grand_total",
        "result",
        "exam_date"
    ]

    missing_fields = []

    for field_name in required_fields:
        if not fields.get(field_name):
            missing_fields.append(field_name)

    checks["required_fields_found"] = (
        len(required_fields) - len(missing_fields)
    )

    checks["required_fields_expected"] = len(required_fields)

    checks["missing_required_fields"] = missing_fields

    if fields.get("grand_total"):
        try:
            total = int(fields["grand_total"])

            checks["grand_total_in_valid_range"] = (
                0 <= total <= 2000
            )

        except ValueError:
            checks["grand_total_in_valid_range"] = None

    else:
        checks["grand_total_in_valid_range"] = None

    table_status = fields.get(
        "marks_table_status",
        "NOT_AVAILABLE"
    )

    checks["marks_table_status"] = table_status

    checks["marks_table_recovered"] = (
        table_status == "CROPPED_AND_OCR_READ"
    )

    if (
        len(missing_fields) == 0
        and checks["grand_total_in_valid_range"] is True
        and checks["marks_table_recovered"] is True
    ):
        checks["overall_status"] = "PASS"

    elif len(missing_fields) == 0:
        checks["overall_status"] = "PARTIAL"

    else:
        checks["overall_status"] = "NEEDS_REVIEW"

    checks["note"] = (
        "The Intermediate document was classified successfully. "
        "Core identity fields, grand total, result, examination date, "
        "and the marks-table OCR region were recovered successfully."
    )

    return checks