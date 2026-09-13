from utils import load_image_for_forensics
from structural_checks import detect_seal_stamp, detect_signature_region, check_font_spacing_consistency, detect_letterhead
from ela import error_level_analysis
from copy_move import detect_copy_move
from metadata_forensics import analyze_metadata
from scoring_engine import compute_score


def run_forensics(file_path, ocr_words, logic_check_result):
    """
    Main entry point for Person 4's forensics module.

    Args:
        file_path: path to the uploaded document (image or PDF)
        ocr_words: list of OCR word boxes from Person 3's module
                    (each with text/confidence/x/y/width/height) — pass [] if unavailable
        logic_check_result: Person 3's field-validation result,
                    e.g. {"status": "PASS", "checks": [...]}

    Returns:
        A single JSON-serializable dict — this is what gets written to
        Person 2's `verification_results` table (forensic_result / authenticity_score /
        final_status / explanation columns).
    """
    image, resolved_image_path = load_image_for_forensics(file_path)

    seal_result = detect_seal_stamp(image)
    seal_hint = seal_result["regions"][0] if seal_result["regions"] else None

    structural = {
        "seal": seal_result,
        "signature": detect_signature_region(image, seal_region=seal_hint),
        "font": check_font_spacing_consistency(ocr_words),
        "letterhead": detect_letterhead(image),
    }

    ela_result = error_level_analysis(resolved_image_path)
    copy_move_result = detect_copy_move(image)
    metadata_result = analyze_metadata(file_path)

    final_result = compute_score(logic_check_result, structural, ela_result, copy_move_result, metadata_result)

    return {
        "structural_checks": structural,
        "ela": {k: v for k, v in ela_result.items() if k != "ela_image"},
        "copy_move": copy_move_result,
        "metadata": metadata_result,
        "final_result": final_result,
    }