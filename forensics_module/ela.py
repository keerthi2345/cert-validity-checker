from PIL import Image, ImageChops
import numpy as np

def error_level_analysis(image_path, quality=90):
    """
    Re-saves the image at a known JPEG quality and compares it to the original.
    Regions that were edited/pasted after the original save often show a higher
    error level than the untouched parts of the document.
    """
    original = Image.open(image_path).convert("RGB")

    resaved_path = "_ela_temp.jpg"
    original.save(resaved_path, "JPEG", quality=quality)
    resaved = Image.open(resaved_path)

    diff = ImageChops.difference(original, resaved)
    diff_np = np.array(diff)

    max_diff = int(diff_np.max()) if diff_np.size else 0
    mean_diff = float(diff_np.mean())

    return {
        "mean_error_level": round(mean_diff, 3),
        "max_error_level": max_diff,
        "suspicious_regions_present": bool(mean_diff > 8),  # starting threshold — we'll tune this against real samples
    }