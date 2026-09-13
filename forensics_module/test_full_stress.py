import cv2
from utils import load_image_for_forensics
from structural_checks import detect_seal_stamp, detect_signature_region, check_font_spacing_consistency, detect_letterhead
from ela import error_level_analysis
from copy_move import detect_copy_move
from metadata_forensics import analyze_metadata

file_path = "cisco_cert.pdf"
image = load_image_for_forensics(file_path)

seal_result = detect_seal_stamp(image)
print("Seal:", seal_result)

seal_hint = seal_result["regions"][0] if seal_result["regions"] else None
print("Signature:", detect_signature_region(image, seal_region=seal_hint))

print("Letterhead:", detect_letterhead(image))
print("Copy-move:", detect_copy_move(image))
print("Metadata:", analyze_metadata(file_path))