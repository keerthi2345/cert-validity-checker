WEIGHTS = {
    "logic_check_fail": 0.25,
    "seal_missing": 0.15,
    "signature_missing": 0.10,
    "font_inconsistent": 0.15,
    "ela_suspicious": 0.15,
    "copy_move_detected": 0.15,
    "metadata_suspicious": 0.05,
}

def compute_score(logic_check_result, structural, ela_result, copy_move_result, metadata_result):
    """
    Combines Person 3's field-validation result with our own forensic signals
    into one final authenticity score (1.0 = fully clean, 0.0 = maximally flagged).
    """
    penalty = 0.0
    reasons = []

    if logic_check_result.get("status") != "PASS":
        penalty += WEIGHTS["logic_check_fail"]
        reasons.append("Field/logic validation failed (e.g. marks or date mismatch).")

    if not structural["seal"]["seal_present"]:
        penalty += WEIGHTS["seal_missing"]
        reasons.append("No seal/stamp detected.")

    if not structural["signature"]["signature_likely"]:
        penalty += WEIGHTS["signature_missing"]
        reasons.append("No signature region detected.")

    if not structural["font"]["consistent"]:
        penalty += WEIGHTS["font_inconsistent"]
        reasons.append("Inconsistent font sizing/spacing across the document.")

    if ela_result["suspicious_regions_present"]:
        penalty += WEIGHTS["ela_suspicious"]
        reasons.append("Error Level Analysis found abnormal compression patterns.")

    if copy_move_result["copy_move_detected"]:
        penalty += WEIGHTS["copy_move_detected"]
        reasons.append("Possible copy-move/splicing detected within the document.")

    if metadata_result.get("suspicious") or metadata_result.get("modified_after_creation"):
        penalty += WEIGHTS["metadata_suspicious"]
        reasons.append("Document metadata suggests post-creation editing.")

    score = round(max(0.0, 1.0 - penalty), 3)

    # Certain findings are serious enough to cap the score outright — a single
    # strong red flag shouldn't be "averaged away" by otherwise-clean checks.
    hard_cap = 1.0
    if copy_move_result["copy_move_detected"]:
        hard_cap = min(hard_cap, 0.60)
    if ela_result["suspicious_regions_present"]:
        hard_cap = min(hard_cap, 0.60)
    if logic_check_result.get("status") != "PASS":
        hard_cap = min(hard_cap, 0.60)

    score = min(score, hard_cap)

    if score >= 0.75:
        label = "Valid"
    elif score >= 0.45:
        label = "Suspicious"
    else:
        label = "Likely Forged"


    return {
        "authenticity_score": score,
        "label": label,
        "explanation": reasons if reasons else ["No issues detected across structural, forensic, or metadata checks."],
    }