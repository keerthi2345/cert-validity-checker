import json
from structural_checks import check_font_spacing_consistency

json_path = r"D:\cert-validity-checker\ocr_module\ocr_results\inter_sample_page_0_ocr.json"

with open(json_path, "r", encoding="utf-8") as f:
    ocr_data = json.load(f)

words = ocr_data["words"]
print("Total words:", len(words))
print(check_font_spacing_consistency(words))