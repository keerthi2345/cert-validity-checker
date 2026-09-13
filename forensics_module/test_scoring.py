import cv2
from structural_checks import detect_seal_stamp, detect_signature_region, check_font_spacing_consistency, detect_letterhead
from ela import error_level_analysis
from copy_move import detect_copy_move
from metadata_forensics import analyze_metadata
from scoring_engine import compute_score

image_path = r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg"
image = cv2.imread(image_path)

seal = detect_seal_stamp(image)
structural = {
    "seal": seal,
    "signature": detect_signature_region(image, seal_region=seal["regions"][0] if seal["regions"] else None),
    "font": {"consistent": True},  # placeholder — real OCR words needed for this one
    "letterhead": detect_letterhead(image),
}

ela_result = error_level_analysis(image_path)
copy_move_result = detect_copy_move(image)
metadata_result = analyze_metadata(image_path)

fake_logic_check = {"status": "PASS"}  # placeholder for Person 3's real output

result = compute_score(fake_logic_check, structural, ela_result, copy_move_result, metadata_result)
print(result)