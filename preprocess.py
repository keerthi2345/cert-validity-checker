import cv2
import numpy as np
from pdf2image import convert_from_path
import os

def pdf_to_images(pdf_path, output_folder="temp_images"):
    """Convert each PDF page into a PNG image."""
    os.makedirs(output_folder, exist_ok=True)
    pages = convert_from_path(pdf_path, dpi=300)
    image_paths = []
    for i, page in enumerate(pages):
        path = os.path.join(output_folder, f"page_{i}.png")
        page.save(path, "PNG")
        image_paths.append(path)
    return image_paths

def deskew(image):
    """Fix tilted scans."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray)
    coords = np.column_stack(np.where(gray > 0))
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return rotated

def denoise_and_normalize(image):
    """Clean up noise and normalize contrast, gently."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, h=10)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    return enhanced
def preprocess_document(input_path):
    """Main entry point: takes a PDF or image path, returns cleaned image(s)."""
    if input_path.lower().endswith(".pdf"):
        image_paths = pdf_to_images(input_path)
    else:
        image_paths = [input_path]

    cleaned_images = []
    for path in image_paths:
        img = cv2.imread(path)
        img = deskew(img)
        cleaned = denoise_and_normalize(img)
        cleaned_images.append(cleaned)
    return cleaned_images

import sys

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_file = sys.argv[1]
    else:
        test_file = "sample_docs/tilted_test.jpg"

    # Get just the filename without extension, e.g. "my_test_image"
    base_name = os.path.splitext(os.path.basename(test_file))[0]

    # Save results into their own output folder
    os.makedirs("outputs", exist_ok=True)

    results = preprocess_document(test_file)
    for i, img in enumerate(results):
        output_path = f"outputs/{base_name}_page_{i}.png"
        cv2.imwrite(output_path, img)
        print(f"Saved: {output_path}")

    print(f"Processed {len(results)} page(s).")