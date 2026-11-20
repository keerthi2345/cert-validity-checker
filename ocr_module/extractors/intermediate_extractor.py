import os
import re

import cv2
import pytesseract


pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def _to_gray(image):
    if image is None:
        return None

    if image.ndim == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    return image


def ocr_band(gray, y0, y1, x0, x1, psm="7", whitelist=None, scale=3):
    """OCR one horizontal band of the page (all bounds are page fractions)."""
    height, width = gray.shape[:2]

    top, bottom = int(height * y0), int(height * y1)
    left, right = int(width * x0), int(width * x1)

    if bottom <= top or right <= left:
        return ""

    crop = cv2.resize(
        gray[top:bottom, left:right],
        None,
        fx=scale,
        fy=scale,
        interpolation=cv2.INTER_CUBIC
    )

    _, crop = cv2.threshold(
        crop,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    config = f"--psm {psm}"

    if whitelist:
        config += f" -c tessedit_char_whitelist={whitelist}"

    try:
        return pytesseract.image_to_string(crop, config=config).strip()
    except Exception:
        return ""


def scan_strips(
    image,
    y_start,
    y_end,
    strip_h=0.03,
    step=0.015,
    x0=0.08,
    x1=0.94
):
    """
    Read a page region as thin overlapping text strips. Strips work on
    text inside table boxes, which full-page OCR often skips.
    """
    gray = _to_gray(image)

    if gray is None:
        return []

    results = []
    y = y_start

    while y < y_end:
        results.append(
            (y, ocr_band(gray, y, min(1.0, y + strip_h), x0, x1))
        )
        y += step

    return results


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

    # Words that mean the name has ended and the next label has begun
    stop_words = {
        "BEARING",
        "REGISTERED",
        "HAS",
        "APPEARED",
        "PASSED"
    }

    clean_words = []

    for word in value.replace(",", " ").split():
        word = word.upper().strip(":;,.()[]{}")

        if word in stop_words:
            break

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
    Extract a name-like value on the same line as a label or on the
    immediately following line.
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
            remainder = remainder.strip(" :;-=")

            if remainder and len(remainder) >= 2:
                value = clean_name_value(remainder)

                if value:
                    if index + 1 < len(lines):
                        next_line = lines[index + 1]

                        if not re.search(
                            r"FATHER|MOTHER|REGD|REGISTRATION|ROLL|NUMBER|"
                            r"DATE|MONTH|YEAR|GRAND|TOTAL|RESULT",
                            next_line,
                            re.IGNORECASE
                        ):
                            continuation = clean_name_value(next_line)

                            if continuation:
                                value = f"{value} {continuation}"

                    return value

            if index + 1 < len(lines):
                next_line = lines[index + 1]

                if not re.search(
                    r"FATHER|MOTHER|REGD|REGISTRATION|ROLL|NUMBER|"
                    r"DATE|MONTH|YEAR|GRAND|TOTAL|RESULT",
                    next_line,
                    re.IGNORECASE
                ):
                    value = clean_name_value(next_line)

                    if value:
                        return value

    return None


DIGIT_WORDS = {
    "ZERO": "0", "ONE": "1", "TWO": "2", "THREE": "3", "FOUR": "4",
    "FIVE": "5", "SIX": "6", "SEVEN": "7", "EIGHT": "8", "NINE": "9"
}

_WORD = r"(?:ZERO|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE)"


def total_from_words(text):
    """
    Read a total written as digit-words, e.g. '*NINE**THREE***NINE*' -> '939'.
    Tries the 'In words' label first, then the star-separated pattern alone.
    """
    match = re.search(
        r"IN\s*WORDS\W{0,10}((?:\W*\b" + _WORD + r"\b)+)",
        text
    )

    if not match:
        match = re.search(
            r"\*?(" + _WORD + r"(?:\*+" + _WORD + r"){1,3})\*?",
            text
        )

    if not match:
        return None

    words = re.findall(_WORD, match.group(1))
    digits = "".join(DIGIT_WORDS[word] for word in words)

    return digits if 2 <= len(digits) <= 4 else None


def result_from_text(text):
    """Find a grade result such as 'A GRADE' (OCR may drop the space)."""
    match = re.search(
        r"PASSED\W{0,6}(?:\w{0,3}\s+)?(?:IN\s+)?([A-Z]{1,10}?)\s*GRADE\b",
        text
    ) or re.search(
        r"PASSED.{0,20}?\b([A-D])\s*GRADE\b",
        text
    ) or re.search(
        r"\b([A-D])\s*GRADE\b",
        text
    )

    if not match:
        return None

    return f"{match.group(1).strip()} GRADE"


def date_from_text(text):
    """Find a dd-mm-yyyy date, preferring one that follows 'DATE'."""
    match = re.search(
        r"(?:DATE|DATED)\W{0,8}"
        r"(\d{2}\s*[/-]\s*\d{2}\s*[/-]\s*\d{4})",
        text
    ) or re.search(
        r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b",
        text
    )

    return re.sub(r"\s+", "", match.group(1)) if match else None


def build_table_result(
    status,
    raw_table_text=None,
    ocr_variants=None,
    crop_top=None,
    crop_bottom=None,
    crop_path=None
):
    """
    Return a consistent Intermediate table-extraction result structure.
    """
    return {
        "marks_table_status": status,
        "raw_table_text": raw_table_text,
        "ocr_variants": (
            ocr_variants
            if ocr_variants is not None
            else {}
        ),
        "crop_top": crop_top,
        "crop_bottom": crop_bottom,
        "marks_table_crop_path": crop_path,
        "subject_marks_parsed": False,
        "subject_marks": [],
        "marks_sum_calculated": None,
        "marks_sum_matches_grand_total": None
    }


def extract_marks_table(image, words, image_width=None):
    """
    Crop the marks table and run multiple focused OCR configurations.

    This function intentionally returns raw OCR evidence only. It does
    not guess subject-level secured marks when table alignment is not
    reliable enough for reconciliation.
    """
    if image is None or not words:
        return build_table_result(
            "NOT_AVAILABLE"
        )

    part_words = [
        word
        for word in words
        if word.get("text", "")
        .upper()
        .strip(":;,.()[]{}")
        == "PART"
    ]

    if not part_words:
        return build_table_result(
            "PART_HEADER_NOT_FOUND"
        )

    table_start_y_ocr = min(
        word.get("y", 0)
        for word in part_words
    )

    grand_words = [
        word
        for word in words
        if "GRAND" in word.get("text", "").upper()
    ]

    if not grand_words:
        return build_table_result(
            "GRAND_TOTAL_NOT_FOUND"
        )

    grand_y_values = [word.get("y", 0) for word in grand_words]

    table_start_y_ocr, table_end_y_ocr = (
        min(table_start_y_ocr, min(grand_y_values)),
        max(table_start_y_ocr, max(grand_y_values))
    )

    if table_end_y_ocr <= table_start_y_ocr:
        return build_table_result(
            "INVALID_TABLE_REGION"
        )

    original_height, original_width = image.shape[:2]

    if image_width and image_width > 0:
        scale = original_width / image_width
    else:
        max_x = max(
            word.get("x", 0)
            + word.get("width", 0)
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
        return build_table_result(
            "INVALID_CROP",
            crop_top=crop_top,
            crop_bottom=crop_bottom
        )

    crop = image[crop_top:crop_bottom, :]

    os.makedirs("outputs", exist_ok=True)

    crop_path = os.path.join(
        "outputs",
        "intermediate_marks_table_crop.png"
    )

    cv2.imwrite(crop_path, crop)

    enlarged_crop = cv2.resize(
        crop,
        None,
        fx=2,
        fy=2,
        interpolation=cv2.INTER_CUBIC
    )

    gray_crop = cv2.cvtColor(
        enlarged_crop,
        cv2.COLOR_BGR2GRAY
    )

    _, threshold_crop = cv2.threshold(
        gray_crop,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    ocr_configs = {
        "psm_4": "--psm 4",
        "psm_6": "--psm 6",
        "psm_11": "--psm 11",
        "digits_psm_6": (
            "--psm 6 "
            "-c tessedit_char_whitelist=0123456789"
        ),
        "digits_psm_11": (
            "--psm 11 "
            "-c tessedit_char_whitelist=0123456789"
        )
    }

    ocr_variants = {}

    for config_name, config_value in ocr_configs.items():
        ocr_variants[config_name] = (
            pytesseract.image_to_string(
                threshold_crop,
                config=config_value
            )
        )

    table_text = ocr_variants["psm_6"]

    has_numeric_marks = bool(
        re.search(r"\b\d{2,3}\b", table_text)
    )

    status = (
        "CROPPED_AND_OCR_READ"
        if has_numeric_marks
        else "CROPPED_BUT_MARKS_NOT_READ"
    )

    return build_table_result(
        status,
        raw_table_text=table_text,
        ocr_variants=ocr_variants,
        crop_top=crop_top,
        crop_bottom=crop_bottom,
        crop_path=crop_path
    )


def extract_intermediate_fields(
    reconstructed_text,
    raw_text,
    words,
    image_width=1000,
    image=None
):
    """
    Extract core identity/result fields from an Intermediate marks memo
    and recover the marks-table OCR region.
    """
    fields = {}

    reconstructed_text = reconstructed_text.replace("\u2019", "'")
    raw_text = raw_text.replace("\u2019", "'")

    combined_text = (
        f"{reconstructed_text}\n{raw_text}"
    ).upper()

    regd_number_match = re.search(
        r"(?:REGD|REGISTRATION|ROLL)\s*"
        r"(?:NO|NUMBER)?\s*[:;.]?\s*(\d{8,15})",
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
            r"NAME\s+OF\s+THE\s+CANDIDATE\s*[:;.]?",
            r"CERTIFY\s+THAT\s*[:;.]?"
        ]
    )

    fields["father_name"] = extract_value_after_label(
        reconstructed_text,
        [
            r"FATHER\'?S?\s*NAME\s*[:;.]?",
            r"FATHER\s*NAME\s*[:;.]?"
        ]
    )

    fields["mother_name"] = extract_value_after_label(
        reconstructed_text,
        [
            r"MOTHER\'?S?\s*(?:THER\s*)?NAME\s*[:;.]?",
            r"MOTHER\s*NAME\s*[:;.]?"
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

    # Layouts labelled "Total Marks ... In words" have no "GRAND TOTAL" text
    if not fields["grand_total"]:
        fields["grand_total"] = total_from_words(combined_text)

    result_match = re.search(
        r"RESULT\s*[:;.]?\s*"
        r"([A-Z]+\s+GRADE|QUALIFIED|PASSED)",
        combined_text,
        re.IGNORECASE
    )

    fields["result"] = (
        result_match.group(1).strip()
        if result_match
        else None
    )

    # Layouts that say "... and passed in A GRADE" instead of "RESULT: ..."
    if not fields["result"]:
        fields["result"] = result_from_text(combined_text)

    date_match = re.search(
        r"(?:DATE|DATED)\s*[:;.]?\s*"
        r"(\d{2}[/-]\d{2}[/-]\d{4})",
        combined_text,
        re.IGNORECASE
    )

    fields["exam_date"] = (
        date_match.group(1)
        if date_match
        else None
    )

    # Tolerate table-border characters or spaces between the label and date
    if not fields["exam_date"]:
        fields["exam_date"] = date_from_text(combined_text)

    # Last resort: text inside table boxes is often skipped by full-page
    # OCR, so re-read the lower part of the page in thin strips.
    if image is not None and not all(
        fields.get(name) for name in ("grand_total", "result", "exam_date")
    ):
        strip_text = "\n".join(
            text for _, text in scan_strips(image, 0.30, 0.90)
        ).upper()

        if not fields["grand_total"]:
            fields["grand_total"] = total_from_words(strip_text)

        if not fields["result"]:
            fields["result"] = result_from_text(strip_text)

        if not fields["exam_date"]:
            fields["exam_date"] = date_from_text(strip_text)

    table_data = extract_marks_table(
        image,
        words,
        image_width
    )

    fields.update(table_data)

    return fields


def validate_intermediate_fields(fields):
    """
    Validate conservatively.

    PASS requires subject marks to be parsed and to reconcile exactly
    with the printed grand total. Table OCR recovery alone is PARTIAL.
    """
    checks = {}

    required_fields = [
        "regd_number",
        "name",
        "grand_total",
        "result",
        "exam_date"
    ]

    missing_fields = [
        field_name
        for field_name in required_fields
        if not fields.get(field_name)
    ]

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

    checks["marks_table_status"] = fields.get(
        "marks_table_status",
        "NOT_AVAILABLE"
    )

    checks["marks_table_recovered"] = (
        checks["marks_table_status"]
        == "CROPPED_AND_OCR_READ"
    )

    checks["subject_marks_parsed"] = bool(
        fields.get("subject_marks_parsed", False)
    )

    checks["marks_sum_calculated"] = fields.get(
        "marks_sum_calculated"
    )

    checks["marks_sum_matches_grand_total"] = fields.get(
        "marks_sum_matches_grand_total"
    )

    if missing_fields:
        checks["overall_status"] = "NEEDS_REVIEW"

    elif (
        checks["grand_total_in_valid_range"] is True
        and checks["subject_marks_parsed"] is True
        and checks["marks_sum_matches_grand_total"] is True
    ):
        checks["overall_status"] = "PASS"

    else:
        checks["overall_status"] = "PARTIAL"

    if checks["overall_status"] == "PASS":
        checks["note"] = (
            "Core identity fields, subject-level marks, and the "
            "printed grand total were extracted successfully. "
            "The calculated marks sum matches the printed total."
        )

    elif checks["overall_status"] == "PARTIAL":
        checks["note"] = (
            "Core identity fields, grand total, result, examination "
            "date, and a marks-table OCR crop were recovered. "
            "Subject-level secured marks have not yet been reliably "
            "parsed and reconciled against the grand total, so "
            "manual review is still required."
        )

    else:
        checks["note"] = (
            "One or more required Intermediate memo fields could not "
            "be extracted reliably. Manual review is required."
        )

    return checks