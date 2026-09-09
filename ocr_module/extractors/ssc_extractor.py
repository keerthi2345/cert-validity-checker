import re


def clean_text(text):
    if not text:
        return ""

    text = text.upper()
    text = text.replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{2,}", "\n", text)

    return text.strip()


def clean_name(value):
    if not value:
        return None

    value = value.upper()
    value = re.sub(r"[^A-Z\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()

    stop_words = {
        "THAT",
        "ROLL",
        "NO",
        "NUMBER",
        "DATE",
        "BIRTH",
        "MOTHER",
        "FATHER",
        "NAME",
        "SSC",
        "EXAMINATION"
    }

    cleaned_words = []

    for word in value.split():
        if word in stop_words:
            break

        cleaned_words.append(word)

    result = " ".join(cleaned_words).strip()

    return result if result else None


def first_match(patterns, texts):
    for text in texts:
        for pattern in patterns:
            match = re.search(
                pattern,
                text,
                re.IGNORECASE | re.DOTALL
            )

            if match:
                return match.group(1).strip()

    return None


def normalize_numeric_token(token):
    if token is None:
        return None

    token = token.strip().upper()
    token = token.replace("O", "0")
    token = token.replace("I", "1")
    token = token.replace("L", "1")
    token = token.replace("S", "5")
    token = re.sub(r"[^0-9]", "", token)

    return token if token else None


def find_number_near_subject(words, subject_terms, image_width):
    """
    Find the closest valid mark on the same row as a subject label.

    For this SSC template, marks are located in the central marks column.
    The x-range is calculated as a percentage of image width, so it works
    after OCR image resizing.
    """
    subject_words = []

    for word in words:
        cleaned = word.get("text", "").upper().strip(
            " :;,.()[]{}"
        )

        if cleaned in subject_terms:
            subject_words.append(word)

    if not subject_words:
        return None

    # Your OCR result shows marks around x=1243 to x=1249.
    # This is approximately the middle section of the page.
    marks_x_min = image_width * 0.42
    marks_x_max = image_width * 0.56

    best_mark = None
    best_score = None

    for subject_word in subject_words:
        subject_y = subject_word.get("y", 0)

        for word in words:
            word_x = word.get("x", 0)
            word_y = word.get("y", 0)

            # Ignore numbers outside the expected marks column.
            if not (marks_x_min <= word_x <= marks_x_max):
                continue

            numeric_text = normalize_numeric_token(
                word.get("text", "")
            )

            if not numeric_text:
                continue

            try:
                mark = int(numeric_text)
            except ValueError:
                continue

            # Reject clearly invalid marks.
            if mark < 20 or mark > 100:
                continue

            y_distance = abs(word_y - subject_y)

            # Subject and mark must be on nearly the same row.
            if y_distance > 70:
                continue

            # Smaller vertical distance means a better match.
            if best_score is None or y_distance < best_score:
                best_score = y_distance
                best_mark = str(mark)

    return best_mark


def find_mark_from_text(texts, patterns):
    for text in texts:
        for pattern in patterns:
            match = re.search(
                pattern,
                text,
                re.IGNORECASE | re.DOTALL
            )

            if match:
                value = normalize_numeric_token(match.group(1))

                if value:
                    try:
                        mark = int(value)

                        if 20 <= mark <= 100:
                            return str(mark)

                    except ValueError:
                        pass

    return None


def extract_ssc_fields(reconstructed_text, raw_text, words, image_width):
    reconstructed_text = clean_text(reconstructed_text)
    raw_text = clean_text(raw_text)

    texts = [reconstructed_text, raw_text]
    fields = {}

    name_value = first_match(
        [
            r"CERTIFIED\s+([A-Z\s]{3,80}?)\s+THAT",
            r"CERTIFIED\s+([A-Z\s]{3,80}?)(?:\n|FATHER|MOTHER|ROLL)"
        ],
        texts
    )

    fields["name"] = clean_name(name_value)

    father_value = first_match(
        [
            r"FATHER(?:'S|S)?\s+NAM[EI]\s*[:;]?\s*([A-Z\s]{3,100}?)(?=\s+MOT(?:HER|IIER)|\s+ROLL|\n)",
            r"FATHER(?:'S|S)?\s+NAM[EI]\s*[:;]?\s*([A-Z\s]{3,100})"
        ],
        texts
    )

    fields["father_name"] = clean_name(father_value)

    mother_value = first_match(
        [
            r"(?:MOTHER|MOTIIER|AOTHER)\s+NAME\s*[:;]?\s*([A-Z\s]{3,100}?)(?=\s+ROLL|\s+HEARING|\n)",
            r"(?:MOTHER|MOTIIER|AOTHER)\s+NAME\s*[:;]?\s*([A-Z\s]{3,100})"
        ],
        texts
    )

    fields["mother_name"] = clean_name(mother_value)

    roll_no = first_match(
        [
            r"ROLL\s*(?:NO|NUMBER)?\s*[:;]?\s*(\d{8,15})",
            r"(\d{10})(?=\s*(?:ROLL|NO|HEARING))"
        ],
        texts
    )

    if not roll_no:
        for word in words:
            token = normalize_numeric_token(word.get("text", ""))

            if token and len(token) == 10:
                roll_no = token
                break

    fields["roll_no"] = roll_no

    fields["date_of_birth"] = first_match(
        [
            r"(?:DATE\s*OF\s*BIRTH|DATEOFBIRTH|SEDATE\s*OFBIRTH)\D{0,50}(\d{2}[/-]\d{2}[/-]\d{4})",
            r"(\d{2}[/-]\d{2}[/-]\d{4})"
        ],
        texts
    )

    fields["exam_year"] = first_match(
        [
            r"SSC\s+EXAMINATION\s+HELD\s+IN\s+[A-Z]+\s+(\d{4})",
            r"EXAMINATION\s+HELD\s+IN\s+[A-Z]+\s+(\d{4})",
            r"HELD\s+IN\s+[A-Z]+\s+(\d{4})"
        ],
        texts
    )

    subject_coordinate_terms = {
        "first_language_marks": {"TELUGU", "SANSKRIT", "URDU"},
        "second_language_marks": {"HINDI"},
        "third_language_marks": {"ENGLISH"},
        "mathematics_marks": {"MATHEMATICS", "MATHS"},
        "general_science_marks": {"GENERAL", "SCIENCE"},
        "social_studies_marks": {"SOCIAL", "STUDIES"}
    }

    subject_text_patterns = {
        "first_language_marks": [
            r"(?:TELUGU|SANSKRIT|URDU)[^0-9]{0,60}(\d{2,3})"
        ],
        "second_language_marks": [
            r"(?:HINDI|SECOND\s+LANGUAGE)[^0-9]{0,60}(\d{2,3})"
        ],
        "third_language_marks": [
            r"(?:THIRD\s+LANGUAGE|ENGLISH)[^0-9]{0,60}(\d{2,3})"
        ],
        "mathematics_marks": [
            r"(?:MATHEMATICS|MATHS)[^0-9]{0,60}(\d{2,3})"
        ],
        "general_science_marks": [
            r"(?:GENERAL\s+SCIENCE|SCIENCE)[^0-9]{0,60}(\d{2,3})"
        ],
        "social_studies_marks": [
            r"(?:SOCIAL\s+STUDIES|STUDIES)[^0-9]{0,60}(\d{2,3})"
        ]
    }

    for field_name, subject_terms in subject_coordinate_terms.items():
        mark = find_number_near_subject(
            words,
            subject_terms,
            image_width
        )

        if mark is None:
            mark = find_mark_from_text(
                texts,
                subject_text_patterns[field_name]
            )

        fields[field_name] = mark

    fields["grand_total"] = first_match(
        [
            r"GRAND\s+TOTAL\s*[:;.]?\s*(\d{2,4})",
            r"TOTAL\s*[:;.]?\s*(\d{2,4})"
        ],
        texts
    )

    return fields


def validate_ssc_fields(fields):
    checks = {}

    required_fields = [
        "name",
        "roll_no",
        "date_of_birth",
        "exam_year",
        "grand_total"
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

    if fields.get("date_of_birth") and fields.get("exam_year"):
        try:
            dob_year = int(
                fields["date_of_birth"]
                .replace("-", "/")
                .split("/")[-1]
            )

            exam_year = int(fields["exam_year"])
            age_at_exam = exam_year - dob_year

            checks["age_at_exam"] = age_at_exam
            checks["age_at_exam_valid"] = 14 <= age_at_exam <= 20

        except (ValueError, IndexError):
            checks["age_at_exam"] = None
            checks["age_at_exam_valid"] = None

    else:
        checks["age_at_exam"] = None
        checks["age_at_exam_valid"] = None

    subject_fields = [
        "first_language_marks",
        "second_language_marks",
        "third_language_marks",
        "mathematics_marks",
        "general_science_marks",
        "social_studies_marks"
    ]

    marks = []

    for field_name in subject_fields:
        value = fields.get(field_name)

        if value is not None:
            try:
                numeric_mark = int(value)

                if 20 <= numeric_mark <= 100:
                    marks.append(numeric_mark)

            except ValueError:
                pass

    checks["marks_fields_found"] = len(marks)
    checks["marks_fields_expected"] = len(subject_fields)

    if fields.get("grand_total"):
        try:
            grand_total = int(fields["grand_total"])

            checks["calculated_percentage"] = round(
                (grand_total / 600) * 100,
                2
            )

            checks["grand_total_in_valid_range"] = (
                0 <= grand_total <= 600
            )

        except ValueError:
            checks["calculated_percentage"] = None
            checks["grand_total_in_valid_range"] = None

    else:
        checks["calculated_percentage"] = None
        checks["grand_total_in_valid_range"] = None

    if len(marks) == 6 and fields.get("grand_total"):
        calculated_sum = sum(marks)

        try:
            stated_total = int(fields["grand_total"])

            checks["marks_sum_calculated"] = calculated_sum
            checks["marks_sum_matches_total"] = (
                calculated_sum == stated_total
            )

        except ValueError:
            checks["marks_sum_calculated"] = calculated_sum
            checks["marks_sum_matches_total"] = None

    else:
        checks["marks_sum_calculated"] = sum(marks) if marks else None
        checks["marks_sum_matches_total"] = None

    if (
        len(missing_fields) == 0
        and len(marks) == 6
        and checks.get("marks_sum_matches_total") is True
    ):
        checks["overall_status"] = "PASS"

    elif (
        len(missing_fields) == 0
        and len(marks) == 6
        and checks.get("marks_sum_matches_total") is False
    ):
        checks["overall_status"] = "NEEDS_REVIEW"

    elif fields.get("roll_no") and fields.get("grand_total"):
        checks["overall_status"] = "PARTIAL"

    else:
        checks["overall_status"] = "NEEDS_REVIEW"

    checks["note"] = (
        "Validation checks document-data consistency only. "
        "They do not by themselves prove that a document is authentic."
    )

    return checks