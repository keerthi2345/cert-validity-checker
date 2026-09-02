from PIL import Image, ImageDraw, ImageFont
import os

def create_tilted_test_image():
    # Create a blank white image
    img = Image.new('RGB', (800, 500), color='white')
    draw = ImageDraw.Draw(img)

    # Draw some fake certificate-like text
    text_lines = [
        "TRANSFER CERTIFICATE",
        "Name: John Doe",
        "Date of Birth: 01/01/2005",
        "School: ABC High School",
        "Marks: 450/500",
        "Board: State Board"
    ]

    y = 50
    for line in text_lines:
        draw.text((100, y), line, fill='black')
        y += 60

    # Draw a border so tilt is visually obvious
    draw.rectangle([10, 10, 790, 490], outline='black', width=3)

    # Save the straight version first
    os.makedirs("sample_docs", exist_ok=True)
    img.save("sample_docs/straight_test.jpg")

    # Now rotate it to simulate a tilted scan
    tilted = img.rotate(8, expand=True, fillcolor='white')  # 8 degree tilt
    tilted.save("sample_docs/tilted_test.jpg")

    print("Created sample_docs/straight_test.jpg (for reference)")
    print("Created sample_docs/tilted_test.jpg (tilted 8 degrees - use this to test deskew)")

if __name__ == "__main__":
    create_tilted_test_image()