import json
from app.integrations.person3 import run_ocr_pipeline

result = run_ocr_pipeline(r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg")
print(json.dumps(result, indent=2)[:2000])  # first 2000 chars — full output is long