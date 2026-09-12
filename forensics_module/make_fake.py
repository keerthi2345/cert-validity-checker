from PIL import Image

image_path = r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg"
image = Image.open(image_path).convert("RGB")

# Copy a real patch of the image (some actual printed text/marks) ...
patch_box = (100, 900, 400, 1000)   # left, top, right, bottom
patch = image.crop(patch_box)

# ...and paste it somewhere else, simulating a copy-move edit
image.paste(patch, (100, 1300))

image.save("fake_edited.jpg", "JPEG", quality=95)
print("Saved fake_edited.jpg — pasted a copied patch at (100, 1300)")