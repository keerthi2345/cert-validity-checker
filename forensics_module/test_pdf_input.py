from utils import load_image_for_forensics

image, path = load_image_for_forensics("cisco_cert.pdf")
print("Loaded image shape:", image.shape, "| resolved path:", path)