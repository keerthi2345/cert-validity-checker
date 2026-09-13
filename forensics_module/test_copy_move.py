import cv2
from copy_move import detect_copy_move

image_path = "fake_edited.jpg"
image = cv2.imread(image_path)

print(detect_copy_move(image))