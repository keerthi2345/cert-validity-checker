import re
import cv2
import pytesseract


pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


SUBJECT_KEYWORDS = [
    "MICROPROCESSORS",
    "DESIGN AND ANALYSIS",
    "DATABASE MANAGEMENT",
    "FORMAL LANGUAGES",
    "AUTOMATA THEORY",
    "MANAGERIAL ECONOMICS",
    "ALGORITHMS LAB",
    "DATABASE MANAGEMENT SYSTEMS LAB",
    "WEB TECHNOLOGIES LAB",
    "PROFESSIONAL ETHICS",
    "UNIVERSAL HUMAN VALUES",
    "OPERATING SYSTEMS",
    "COMPUTER NETWORKS",
    "MACHINE LEARNING",
    "ARTIFICIAL INTELLIGENCE",
    "DATA STRUCTURES",
    "SOFTWARE ENGINEERING",
    "COMPILER DESIGN",
    "DISCRETE MATHEMATICS"
]


HEADER_KEYWORDS = [
    "BRANCH NAME",
    "REGISTER NUMBER",
    "NAME OF THE CANDIDATE",
    "GRADE CARD",
    "SUBJECTS SUBJECT",
    "CREDITS OBTAINED",
    "GRADE OBTAINED",
    "SEMESTER GRADE POINT",
    "CUMULATIVE GRADE POINT",
    "CONTROLLER OF EXAMINATIONS",
    "PASSING MINIMUM"
]


def clean_text(text):
    if not text:
        return ""

    text = text.upper()
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)

    return text.strip()


def clean_name(value):
    """Remove punctuation and OCR noise from a student name."""
    if not value:
        return None

    value = value.upper()
    value = re.sub(r"[^A-Z\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()

    ignored_words = {
        "NAME",
        "OF",
        "THE",
        "CANDIDATE",
        "REGISTER",
        "NUMBER",
        "BRANCH",
        "GRADE",
        "CARD"
    }

    words = []

    for word in value.split():
        if word in ignored_words:
            break

        if word.isalpha():
            words.append(word)

    result = " ".join(words).strip()

    return result if result else None


def normalize_grade(token):
    """Normalize common OCR mistakes in grade values."""
    if not token:
        return None

    token = token.upper().strip(" :;,.()[]{}")

    grade_fixes = {
        "AT": "A+",
        "A+": "A+",
        "A": "A",
        "B+": "B+",
        "B": "B",
        "C+": "C+",
        "C": "C",
        "P": "P",
        "F": "F",
        "O": "O",
        "0": "O",
        "°": "O"
    }

    return grade_fixes.get(token)


def find_gpa_label_word(words, label):
    """Find an OCR word containing SGPA or CGPA."""
    for word in words:
        cleaned = word.get("text", "").upper()

        if label in cleaned:
            return word

    return None


def extract_gpa_from_crop(image, words, image_width):
    """
    Crop the SGPA/CGPA region and run a focused OCR pass.

    OCR coordinates are based on a 2x enlarged OCR image.
    The supplied processed image is smaller, so scale coordinates first.
    """
    result = {
        "gpa_crop_status": "NOT_AVAILABLE",
        "gpa_crop_text": None,
        "sgpa": None,
        "cgpa": None
    }

    if image is None or not words:
        return result

    sgpa_word = find_gpa_label_word(words, "SGPA")
    cgpa_word = find_gpa_label_word(words, "CGPA")

    if not sgpa_word or not cgpa_word:
        result["gpa_crop_status"] = "LABELS_NOT_FOUND"
        return result

    image_height, image_actual_width = image.shape[:2]

    if image_width and image_width > 0:
        scale = image_actual_width / image_width
    else:
        max_x = max(
            word.get("x", 0) + word.get("width", 0)
            for word in words
        )
        scale = image_actual_width / max(max_x, 1)

    start_y_ocr = min(
        sgpa_word["y"],
        cgpa_word["y"]
    )

    end_y_ocr = max(
        sgpa_word["y"] + sgpa_word.get("height", 0),
        cgpa_word["y"] + cgpa_word.get("height", 0)
    )

    crop_top = max(
        0,
        int(start_y_ocr * scale) - 35
    )

    crop_bottom = min(
        image_height,
        int(end_y_ocr * scale) + 70
    )

    if crop_bottom <= crop_top:
        result["gpa_crop_status"] = "INVALID_CROP"
        return result

    crop = image[crop_top:crop_bottom, :]

    cv2.imwrite(
        "outputs/semester_gpa_crop.png",
        crop
    )

    enlarged_crop = cv2.resize(
        crop,
        None,
        fx=3,
        fy=3,
        interpolation=cv2.INTER_CUBIC
    )

    gray = cv2.cvtColor(
        enlarged_crop,
        cv2.COLOR_BGR2GRAY
    )

    _, thresholded = cv2.threshold(
        gray,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    crop_text = pytesseract.image_to_string(
        thresholded,
        config="--psm 6"
    )

    result["gpa_crop_status"] = "CROPPED_AND_OCR_READ"
    result["gpa_crop_text"] = crop_text
    result["crop_top"] = crop_top
    result["crop_bottom"] = crop_bottom

    sgpa_match = re.search(
        r"(?:S\.?\s*G\.?\s*P\.?\s*A\.?|SGPA)\D{0,25}(\d(?:\.\d{1,2})?)",
        crop_text,
        re.IGNORECASE
    )

    cgpa_match = re.search(
        r"(?:C\.?\s*G\.?\s*P\.?\s*A\.?|CGPA)\D{0,25}(\d(?:\.\d{1,2})?)",
        crop_text,
        re.IGNORECASE
    )

    if sgpa_match:
        result["sgpa"] = sgpa_match.group(1)

    if cgpa_match:
        result["cgpa"] = cgpa_match.group(1)

    return result


def extract_subjects(reconstructed_text):
    """
    Extract only valid subject rows from reconstructed OCR text.

    The function deliberately ignores headers and incomplete random rows.
    """
    subjects = []

    lines = [
        line.strip()
        for line in reconstructed_text.split("\n")
        if line.strip()
    ]

    for index, line in enumerate(lines):
        line_upper = line.upper()

        if any(
            header in line_upper
            for header in HEADER_KEYWORDS
        ):
            continue

        if not any(
            keyword in line_upper
            for keyword in SUBJECT_KEYWORDS
        ):
            continue

        combined_line = line

        # Some OCR layouts place credits/grade on the following line.
        if index + 1 < len(lines):
            next_line = lines[index + 1].strip()

            if (
                len(next_line) <= 35
                and not any(
                    header in next_line.upper()
                    for header in HEADER_KEYWORDS
                )
            ):
                combined_line += " " + next_line

        cleaned_subject = re.sub(
            r"^[^A-Z]+",
            "",
            line_upper
        )

        cleaned_subject = re.sub(
            r"\s+(?:\d+(?:\.\d+)?|A\+|AT|A|B\+|B|C\+|C|O|P|F|°)\s*$",
            "",
            cleaned_subject
        )

        cleaned_subject = re.sub(
            r"\s+",
            " ",
            cleaned_subject
        ).strip()

        if len(cleaned_subject) < 4:
            continue

        tokens = combined_line.upper().split()

        grade = None
        credits = None
        grade_points = None

        for token in tokens:
            fixed_grade = normalize_grade(token)

            if fixed_grade:
                grade = fixed_grade
                continue

            if re.fullmatch(r"\d+\.\d{1,2}", token):
                value = float(token)

                if 0.0 <= value <= 40.0:
                    grade_points = token
                continue

            if re.fullmatch(r"\d{1,2}", token):
                value = int(token)

                if 1 <= value <= 6 and credits is None:
                    credits = str(value)

        subject_entry = {
            "subject": cleaned_subject,
            "credits": credits,
            "grade": grade,
            "grade_points": grade_points
        }

        already_exists = any(
            existing["subject"] == subject_entry["subject"]
            for existing in subjects
        )

        if not already_exists:
            subjects.append(subject_entry)

    return subjects


def extract_semester_result_fields(
    reconstructed_text,
    raw_text,
    words,
    image_width=1000,
    image=None
):
    """Extract core Semester Result / Grade Card fields."""
    fields = {}

    reconstructed_text = clean_text(reconstructed_text)
    raw_text = clean_text(raw_text)

    combined_text = (
        reconstructed_text
        + "\n"
        + raw_text
    )

    university_match = re.search(
        r"([A-Z\s]{3,60}\s+UNIVERSITY)",
        combined_text,
        re.IGNORECASE
    )

    fields["university"] = (
        university_match.group(1).strip()
        if university_match
        else None
    )

    programme_match = re.search(
        r"(B\.?\s*TECH\.?|BACHELOR\s+OF\s+TECHNOLOGY)",
        combined_text,
        re.IGNORECASE
    )

    fields["programme"] = (
        programme_match.group(1).strip()
        if programme_match
        else None
    )

    semester_match = re.search(
        r"(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH)\s+SEMESTER",
        combined_text,
        re.IGNORECASE
    )

    fields["semester"] = (
        semester_match.group(1).upper()
        if semester_match
        else None
    )

    name_match = re.search(
        r"([A-Z][A-Z\s]{3,60})\nNAME\s+OF\s+THE\s+CANDIDATE",
        reconstructed_text,
        re.IGNORECASE
    )

    if name_match:
        fields["name"] = clean_name(
            name_match.group(1)
        )

    else:
        fields["name"] = None

    register_match = re.search(
        r"REGISTER\s+NUMBER\s*[:;]?\s*(\d{8,15})",
        combined_text,
        re.IGNORECASE
    )

    if register_match:
        fields["register_number"] = register_match.group(1)

    else:
        fields["register_number"] = None

        for word in words:
            number = re.sub(
                r"[^0-9]",
                "",
                word.get("text", "")
            )

            if 9 <= len(number) <= 15:
                fields["register_number"] = number
                break

    branch_match = re.search(
        r"BRANCH\s+NAME\s*[:;]?\s*([A-Z\s&]+)",
        combined_text,
        re.IGNORECASE
    )

    fields["branch"] = (
        branch_match.group(1).strip()
        if branch_match
        else None
    )

    fields["subjects"] = extract_subjects(
        reconstructed_text
    )

    gpa_data = extract_gpa_from_crop(
        image,
        words,
        image_width
    )

    fields["sgpa"] = gpa_data["sgpa"]
    fields["cgpa"] = gpa_data["cgpa"]
    fields["gpa_crop_status"] = gpa_data["gpa_crop_status"]
    fields["gpa_crop_text"] = gpa_data["gpa_crop_text"]

    return fields


def validate_semester_result_fields(fields):
    """Validate extracted Semester Result fields."""
    checks = {}

    required_fields = [
        "name",
        "register_number",
        "branch",
        "semester"
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

    subjects = fields.get("subjects", [])

    valid_subjects = [
        subject
        for subject in subjects
        if subject.get("subject")
    ]

    complete_subjects = [
        subject
        for subject in valid_subjects
        if (
            subject.get("credits")
            and subject.get("grade")
            and subject.get("grade_points")
        )
    ]

    checks["subjects_found"] = len(valid_subjects)
    checks["subjects_with_complete_data"] = len(
        complete_subjects
    )

    grade_points = []

    for subject in complete_subjects:
        try:
            point = float(subject["grade_points"])

            if 0.0 <= point <= 40.0:
                grade_points.append(point)

        except (TypeError, ValueError):
            pass

    checks["total_grade_points_calculated"] = (
        round(sum(grade_points), 2)
        if grade_points
        else None
    )

    for field_name in ["sgpa", "cgpa"]:
        value = fields.get(field_name)

        if value is None:
            checks[f"{field_name}_valid"] = None

        else:
            try:
                numeric_value = float(value)

                checks[f"{field_name}_valid"] = (
                    0.0 <= numeric_value <= 10.0
                )

            except ValueError:
                checks[f"{field_name}_valid"] = False

    if (
        len(missing_fields) == 0
        and len(valid_subjects) >= 4
        and checks.get("sgpa_valid") is True
        and checks.get("cgpa_valid") is True
    ):
        checks["overall_status"] = "PASS"

    elif (
        len(missing_fields) == 0
        and len(valid_subjects) >= 4
    ):
        checks["overall_status"] = "PARTIAL"

    else:
        checks["overall_status"] = "NEEDS_REVIEW"

    checks["note"] = (
        "Semester validation checks OCR extraction consistency. "
        "The final authenticity decision should also use forensic "
        "signals from the verification/scoring module."
    )

    return checks