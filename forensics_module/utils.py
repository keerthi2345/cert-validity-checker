import cv2
import sys

# Reuse Person 3's PDF-to-image conversion, without their denoising step
# (denoising converts to grayscale, which would break our color-based seal detection)
sys.path.append(r"D:\cert-validity-checker\ocr_module")
from preprocess import pdf_to_images

def load_image_for_forensics(file_path):
    """
    Returns (image, resolved_image_path).
    Handles both direct images and PDFs (converts PDF's first page to PNG first).
    The resolved path is needed by ELA, which re-opens the file itself.
    """
    if file_path.lower().endswith(".pdf"):
        page_paths = pdf_to_images(file_path)
        image_path = page_paths[0]
    else:
        image_path = file_path

    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not read image from: {image_path}")
    return image, image_path