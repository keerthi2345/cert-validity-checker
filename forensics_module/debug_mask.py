import cv2
import numpy as np

image_path = r"D:\cert-validity-checker\ocr_module\sample_docs\inter_sample.jpg"
image = cv2.imread(image_path)
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

red_mask1 = cv2.inRange(hsv, np.array([0, 70, 50]), np.array([10, 255, 255]))
red_mask2 = cv2.inRange(hsv, np.array([170, 70, 50]), np.array([180, 255, 255]))
purple_mask = cv2.inRange(hsv, np.array([110, 40, 40]), np.array([160, 255, 255]))
mask = cv2.bitwise_or(cv2.bitwise_or(red_mask1, red_mask2), purple_mask)

cv2.imwrite("debug_mask.png", mask)
print("Saved debug_mask.png — pixels found:", cv2.countNonZero(mask))