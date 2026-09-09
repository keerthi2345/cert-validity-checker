import cv2
import json
import os
import sys

from classify_document import classify_document

from extractors.ssc_extractor import (
    extract_ssc_fields,
    validate_ssc_fields
)

from extractors.intermediate_extractor import (
    extract_intermediate_fields,
    validate_intermediate_fields
)

from extractors.semester_result_extractor import (
    extract_semester_result_fields,
    validate_semester_result_fields
)


EXTRACTOR_REGISTRY = {
    "SSC_MARKS_MEMO": (
        extract_ssc_fields,
        validate_ssc_fields
    ),
    "INTER_MARKS_MEMO": (
        extract_intermediate_fields,
        validate_intermediate_fields
    ),
    "SEMESTER_RESULT": (
        extract_semester_result_fields,
        validate_semester_result_fields
    )
}


def calculate_image_width(ocr_data, words):
    """Use stored OCR image width or estimate it from word coordinates."""
    if "image_width" in ocr_data:
        return ocr_data["image_width"]

    if words:
        return max(
            word.get("x", 0) + word.get("width", 0)
            for word in words
        ) + 20

    return 1000


def build_unknown_result(classification):
    return {
        "doc_type": "UNKNOWN",
        "classification": classification,
        "extracted_fields": {},
        "logic_check_result": {
            "overall_status": "NEEDS_REVIEW",
            "validation_available": False,
            "message": (
                "The document could not be confidently classified "
                "as SSC, Intermediate, or Semester Result."
            )
        }
    }


def load_optional_image(image_path):
    """Load a processed image if supplied by the user."""
    if not image_path:
        return None

    image = cv2.imread(image_path)

    if image is None:
        print(
            f"Warning: Could not read image: {image_path}"
        )

    return image


def process_document(ocr_json_path, image_path=None):
    """Classify, extract fields, validate, and return final JSON."""
    with open(ocr_json_path, "r", encoding="utf-8") as file:
        ocr_data = json.load(file)

    reconstructed_text = ocr_data.get(
        "reconstructed_text",
        ""
    )

    raw_text = ocr_data.get(
        "raw_text",
        ""
    )

    words = ocr_data.get(
        "words",
        []
    )

    image_width = calculate_image_width(
        ocr_data,
        words
    )

    classification = classify_document(
        raw_text,
        reconstructed_text
    )

    doc_type = classification["doc_type"]

    if doc_type not in EXTRACTOR_REGISTRY:
        return build_unknown_result(classification)

    extract_function, validate_function = EXTRACTOR_REGISTRY[
        doc_type
    ]

    image = load_optional_image(image_path)

    if doc_type == "SSC_MARKS_MEMO":
        fields = extract_function(
            reconstructed_text,
            raw_text,
            words,
            image_width
        )

    elif doc_type == "INTER_MARKS_MEMO":
        fields = extract_function(
            reconstructed_text,
            raw_text,
            words,
            image_width,
            image=image
        )

    elif doc_type == "SEMESTER_RESULT":
        fields = extract_function(
            reconstructed_text,
            raw_text,
            words,
            image_width,
            image=image
        )

    else:
        return build_unknown_result(classification)

    logic_check_result = validate_function(fields)

    return {
        "doc_type": doc_type,
        "classification": classification,
        "extracted_fields": fields,
        "logic_check_result": logic_check_result
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print(
            "python main.py <ocr_json_path> "
            "[preprocessed_image_path]"
        )
        print()
        print("SSC example:")
        print(
            "python main.py "
            "ocr_results\\my_test_image_page_0_ocr.json"
        )
        print()
        print("Intermediate example:")
        print(
            "python main.py "
            "ocr_results\\inter_sample_page_0_ocr.json "
            "outputs\\inter_sample_page_0.png"
        )
        print()
        print("Semester example:")
        print(
            "python main.py "
            "ocr_results\\semester_sample_page_0_ocr.json "
            "outputs\\semester_sample_page_0.png"
        )
        sys.exit(1)

    ocr_json_path = sys.argv[1]

    if len(sys.argv) >= 3:
        image_path = sys.argv[2]
    else:
        image_path = None

    result = process_document(
        ocr_json_path,
        image_path
    )

    base_name = os.path.splitext(
        os.path.basename(ocr_json_path)
    )[0]

    os.makedirs(
        "final_results",
        exist_ok=True
    )

    output_path = os.path.join(
        "final_results",
        f"{base_name}_final.json"
    )

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(
            result,
            file,
            indent=2
        )

    print(f"Saved final result to: {output_path}")
    print(json.dumps(result, indent=2))