import json
from app.integrations.person4 import run_forensics_pipeline

with open(r"D:\cert-validity-checker\ocr_module\final_results\inter_sample_page_0_ocr_final.json", "r", encoding="utf-8") as f:
    real_person3_result = json.load(f)

result = run_forensics_pipeline(
    r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg",
    real_person3_result,
)

print(json.dumps(result, indent=2))