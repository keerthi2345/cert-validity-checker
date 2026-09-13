"""
Adapter between Person 3's OCR module (ocr_module/) and
Person 2's Celery task (backend/app/workers/tasks.py).

Chains Person 3's three separate disk-based steps into one function:
  preprocess.preprocess_document() -> cleaned image
  ocr_extract.extract_text_and_boxes() -> OCR JSON (saved to disk)
  main.process_document() -> classification + fields + logic_check_result
"""

import sys
import os
import json
import cv2
import traceback

sys.path.append(r"D:\cert-validity-checker\ocr_module")
from preprocess import preprocess_document
from ocr_extract import extract_text_and_boxes
from main import process_document as classify_and_extract


def run_ocr_pipeline(file_path):
    """
    The function backend/app/workers/tasks.py imports and calls.

    Args:
        file_path: path to the uploaded document (PNG/JPEG/PDF)

    Returns:
        {"doc_type": ..., "extracted_fields": {...},
         "logic_check_result": {...}, "words": [...]}
        — "words" is included so Person 4's font-consistency check can use it.

    Never raises — any failure returns a NEEDS_REVIEW result instead of
    crashing the Celery task, so one bad upload can't take down the queue.
    """
    try:
        # Step 1: preprocess (handles PDF conversion + deskew + denoise internally)
        cleaned_images = preprocess_document(file_path)
        cleaned_image = cleaned_images[0]  # first page

        os.makedirs("temp_ocr_input", exist_ok=True)
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        cleaned_image_path = os.path.join("temp_ocr_input", f"{base_name}_cleaned.png")
        cv2.imwrite(cleaned_image_path, cleaned_image)

        # Step 2: run OCR on the cleaned image
        ocr_result = extract_text_and_boxes(cleaned_image_path)

        ocr_json_path = os.path.join("temp_ocr_input", f"{base_name}_ocr.json")
        with open(ocr_json_path, "w", encoding="utf-8") as f:
            json.dump(ocr_result, f, ensure_ascii=False)

        # Step 3: classify document type, extract fields, validate
        final_result = classify_and_extract(ocr_json_path, cleaned_image_path)

        # Person 4 needs the OCR words too, for font/spacing consistency
        final_result["words"] = ocr_result.get("words", [])

        return final_result

    except Exception as exc:
        return {
            "doc_type": "UNKNOWN",
            "extracted_fields": {},
            "logic_check_result": {
                "overall_status": "NEEDS_REVIEW",
                "validation_available": False,
                "message": f"OCR pipeline failed: {exc}",
            },
            "words": [],
            "error_traceback": traceback.format_exc(),
        }