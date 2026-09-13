from metadata_forensics import analyze_metadata

image_path = r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg"
print("Original:", analyze_metadata(image_path))

print("Fake (re-saved with PIL):", analyze_metadata("fake_edited.jpg"))