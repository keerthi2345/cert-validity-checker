import cv2
import numpy as np

def detect_seal_stamp(image):
    """Look for roughly circular ink marks — covers red, blue, and purple/violet seals."""
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    red_mask1 = cv2.inRange(hsv, np.array([0, 70, 50]), np.array([10, 255, 255]))
    red_mask2 = cv2.inRange(hsv, np.array([170, 70, 50]), np.array([180, 255, 255]))
    purple_mask = cv2.inRange(hsv, np.array([110, 40, 40]), np.array([160, 255, 255]))
    mask = cv2.bitwise_or(cv2.bitwise_or(red_mask1, red_mask2), purple_mask)

    # Stamps are usually a broken ring + small text, not a solid blob.
    # Dilate to merge those nearby pieces into one connected shape.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    merged = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(merged, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    seals = []
    for c in contours:
        area = cv2.contourArea(c)
        if area < 1000:
            continue
        x, y, w, h = cv2.boundingRect(c)
        aspect_ratio = w / float(h)
        # A real seal's bounding box is roughly square (circle), not a long strip of text
        if 0.7 < aspect_ratio < 1.4:
            seals.append({"x": int(x + w / 2), "y": int(y + h / 2), "radius": int(max(w, h) / 2)})

    return {"seal_present": len(seals) > 0, "regions": seals}

def detect_signature_region(image, seal_region=None, band_height_ratio=0.15):
    """
    Look for ink strokes near the seal (signatures and seals are almost always
    placed together on certificates). Falls back to the whole image if no seal found.
    """
    h, w = image.shape[:2]

    if seal_region:
        # Search a horizontal band centered on the seal's y-position
        center_y = seal_region["y"]
        band_h = int(h * band_height_ratio)
        y1 = max(0, center_y - band_h)
        y2 = min(h, center_y + band_h)
        band = image[y1:y2, :]
    else:
        band = image  # no seal hint — check the whole page

    gray = cv2.cvtColor(band, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    ink_contours = [c for c in contours if 80 < cv2.contourArea(c) < 5000]

    return {
        "signature_likely": len(ink_contours) > 3,
        "ink_component_count": len(ink_contours),
    }

def check_font_spacing_consistency(ocr_words):
    """
    Takes a list of OCR word boxes (each with a 'height' key, from Person 3's ocr_module).
    Flags a document if letter heights vary too much — a sign of inconsistent/edited text.
    """
    heights = [
        w["height"] for w in ocr_words
        if w.get("height", 0) > 0 and w.get("confidence", 0) > 30
    ]

    if len(heights) < 5:
        return {"consistent": True, "reason": "not enough text detected to judge"}

    mean_h = np.mean(heights)
    std_h = np.std(heights)
    coefficient_of_variation = std_h / (mean_h + 1e-6)

    return {
        "consistent": bool(coefficient_of_variation < 0.35),
        "coefficient_of_variation": round(float(coefficient_of_variation), 3),
    }