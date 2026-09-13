import json
from app.integrations.person3 import run_ocr_pipeline
from app.integrations.person4 import run_forensics_pipeline

file_path = r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg"

person3_result = run_ocr_pipeline(file_path)
print("Person 3 status:", person3_result["logic_check_result"]["overall_status"])

person4_result = run_forensics_pipeline(file_path, person3_result)
print("Person 4 structural_score:", person4_result["structural_score"])
print("Person 4 forensics_score:", person4_result["forensics_score"])

# This mirrors the exact line we added to tasks.py
final_verdict = person4_result["forensic_result"]["final_result"]
final_score = round(final_verdict["authenticity_score"] * 100, 2)
final_status = final_verdict["label"]

print("\nFINAL SCORE:", final_score)
print("FINAL STATUS:", final_status)

# Confirm the font check now actually has real OCR words to work with
print("\nFont check (should NOT say 'not enough text'):")
print(person4_result["forensic_result"]["structural_checks"]["font"])