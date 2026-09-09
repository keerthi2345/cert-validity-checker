import cv2
import json
import os
import pytesseract
import sys


# Change this only if Tesseract is installed in another location.
pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


def reconstruct_reading_order(words, y_tolerance=10):
    """
    Rebuild text in approximate top-to-bottom and left-to-right order
    using OCR bounding-box coordinates.
    """
    if not words:
        return ""

    sorted_words = sorted(
        words,
        key=lambda word: word["y"]
    )

    lines = []
    current_line = [sorted_words[0]]
    current_y = sorted_words[0]["y"]

    for word in sorted_words[1:]:
        if abs(word["y"] - current_y) <= y_tolerance:
            current_line.append(word)
        else:
            lines.append(current_line)
            current_line = [word]
            current_y = word["y"]

    lines.append(current_line)

    text_lines = []

    for line in lines:
        line_sorted = sorted(
            line,
            key=lambda word: word["x"]
        )

        text_line = " ".join(
            word["text"]
            for word in line_sorted
        )

        text_lines.append(text_line)

    return "\n".join(text_lines)


def extract_text_and_boxes(image_path):
    """
    Run Tesseract OCR on a preprocessed image.

    Returns raw text, reconstructed text, word boxes,
    OCR confidence values, and image dimensions.
    """
    image = cv2.imread(image_path)

    if image is None:
        raise FileNotFoundError(
            f"Could not read image: {image_path}"
        )

    original_height, original_width = image.shape[:2]

    # Upscale before OCR to improve recognition of thin/small certificate text.
    upscaled_image = cv2.resize(
        image,
        (original_width * 2, original_height * 2),
        interpolation=cv2.INTER_CUBIC
    )

    raw_text = pytesseract.image_to_string(
        upscaled_image
    )

    data = pytesseract.image_to_data(
        upscaled_image,
        output_type=pytesseract.Output.DICT
    )

    words = []

    for index in range(len(data["text"])):
        text = data["text"][index].strip()

        if not text:
            continue

        try:
            confidence = float(data["conf"][index])
        except (ValueError, TypeError):
            confidence = -1.0

        words.append({
            "text": text,
            "confidence": confidence,
            "x": int(data["left"][index]),
            "y": int(data["top"][index]),
            "width": int(data["width"][index]),
            "height": int(data["height"][index])
        })

    reconstructed_text = reconstruct_reading_order(
        words
    )

    return {
        "source_image": image_path,
        "raw_text": raw_text,
        "reconstructed_text": reconstructed_text,
        "words": words,
        "image_width": int(upscaled_image.shape[1]),
        "image_height": int(upscaled_image.shape[0])
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = "outputs/my_test_image_page_0.png"

    result = extract_text_and_boxes(image_path)

    base_name = os.path.splitext(
        os.path.basename(image_path)
    )[0]

    os.makedirs(
        "ocr_results",
        exist_ok=True
    )

    output_path = os.path.join(
        "ocr_results",
        f"{base_name}_ocr.json"
    )

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(
            result,
            file,
            indent=2,
            ensure_ascii=False
        )

    print(f"Saved OCR results to: {output_path}")
    print()
    print("--- Reconstructed Text Preview ---")
    print(result["reconstructed_text"][:800])