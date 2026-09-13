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

def detect_signature_region(image, seal_region=None, band_height_ratio=0.15, bottom_fallback_fraction=0.25):
    """
    Look for ink strokes near the seal (signatures and seals are usually together).
    If no seal was found, fall back to just the bottom band of the page (where
    signatures conventionally sit) — NOT the whole page, since scanning the whole
    page on a text-heavy document falsely flags ordinary printed text as a signature.
    """
    h, w = image.shape[:2]

    if seal_region:
        center_y = seal_region["y"]
        band_h = int(h * band_height_ratio)
        y1 = max(0, center_y - band_h)
        y2 = min(h, center_y + band_h)
        band = image[y1:y2, :]
    else:
        band = image[int(h * (1 - bottom_fallback_fraction)):h, :]

    gray = cv2.cvtColor(band, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    ink_contours = [c for c in contours if 80 < cv2.contourArea(c) < 5000]

    count = len(ink_contours)
    # A real signature has a MODERATE amount of ink — too little means blank,
    # too much means we're actually looking at a block of printed text/paragraph.
    signature_likely = 3 < count < 60

    return {
        "signature_likely": signature_likely,
        "ink_component_count": count,
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

def detect_letterhead(image, top_fraction=0.15):
    """
    Checks if the top portion of the document has a meaningful amount of
    printed content (logo/institution name/heading) — genuine certificates
    almost always have this; a cropped/faked page often doesn't.
    """
    h, w = image.shape[:2]
    top = image[0:int(h * top_fraction), :]

    gray = cv2.cvtColor(top, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    ink_ratio = cv2.countNonZero(thresh) / thresh.size

    return {
        "letterhead_likely": ink_ratio > 0.03,
        "ink_ratio": round(float(ink_ratio), 4),
    }