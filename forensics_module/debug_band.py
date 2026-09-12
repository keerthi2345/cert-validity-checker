import cv2

image_path = r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg"
image = cv2.imread(image_path)
h, w = image.shape[:2]

band = image[int(h * 0.65):h, :]
cv2.imwrite("debug_band.png", band)
print("Saved debug_band.png — band size:", band.shape)