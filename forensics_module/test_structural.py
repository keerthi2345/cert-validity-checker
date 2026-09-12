import cv2
from structural_checks import detect_seal_stamp, detect_signature_region

image_path = r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg"
image = cv2.imread(image_path)

if image is None:
    print("Could not read the image — check the path.")
else:
    seal_result = detect_seal_stamp(image)
    print("Seal:", seal_result)

    # Use the first detected seal region as a hint for where to look for a signature
    seal_hint = seal_result["regions"][0] if seal_result["regions"] else None
    print("Signature:", detect_signature_region(image, seal_region=seal_hint))