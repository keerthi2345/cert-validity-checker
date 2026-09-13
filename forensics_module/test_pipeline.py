import json
from pipeline import run_forensics

result = run_forensics(
    file_path="fake_edited.jpg",
    ocr_words=[],  # placeholder — plug in Person 3's real OCR words when integrating
    logic_check_result={"status": "PASS"},
)

print(json.dumps(result, indent=2))