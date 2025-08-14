import cv2
import numpy as np
import tkinter as tk
from tkinter import filedialog
from pysaga.api.master_to_mezz import find_objects_white_background
import imutils
from pysaga.utils.image_hash import compare_with_color_templates, compare_with_gray_templates
from PIL import Image

# --- Main script logic ---
def main():
    root = tk.Tk()
    root.withdraw()

    print("Opening file selector...")
    file_path = filedialog.askopenfilename(
        title="Select a Scanned Image",
        filetypes=[("Image Files", "*.tif *.tiff *.png *.jpg *.jpeg"), ("All files", "*.*")]
    )

    if not file_path:
        print("No file selected. Exiting.")
        return

    print(f"File selected: {file_path}")
    original_image = cv2.imread(file_path, cv2.IMREAD_COLOR)

    if original_image is None:
        print("Error: Could not load the selected image.")
        return

    print("Processing image to find contours...")
    found_contours = find_objects_white_background(original_image)

    kodak_color_patch_idx = None
    kodak_gray_patch_idx = None

    for idx, contour in enumerate(found_contours):
        # Calculate the bounding box for each contour
        x, y, w, h = cv2.boundingRect(contour)
        print(f"Contour bounding box: x={x}, y={y}, w={w}, h={h}")

        # Compare the image with templates
        color_comparison = compare_with_color_templates(Image.fromarray(original_image[y:y+h, x:x+w]))
        gray_comparison = compare_with_gray_templates(Image.fromarray(original_image[y:y+h, x:x+w]))

        print(f"Color comparison results: {color_comparison}")
        print(f"Gray comparison results: {gray_comparison}")

        for orientation, result in color_comparison.items():
            if result <= 12:
                print(f"Color match found for {orientation} orientation with result: {result}")
                kodak_color_patch_idx = idx

        for orientation, result in gray_comparison.items():
            if result <= 12:
                print(f"Gray match found for {orientation} orientation with result: {result}")
                kodak_gray_patch_idx = idx
    

    # Create the image with contours drawn on it ONCE.
    image_with_contours = original_image.copy()
    if found_contours is not None:
        print(f"Found {len(found_contours)} contours.")

        # kodak color in blue
        if kodak_color_patch_idx is not None:
            cv2.drawContours(image_with_contours, [found_contours[kodak_color_patch_idx]], -1, (255, 0, 0), 3)
            
        # kodak grey in red
        if kodak_gray_patch_idx is not None:
            cv2.drawContours(image_with_contours, [found_contours[kodak_gray_patch_idx]], -1, (0, 0, 255), 3) 

        cv2.drawContours(image_with_contours, list([contour for idx, contour in enumerate(found_contours) if idx not in (kodak_color_patch_idx, kodak_gray_patch_idx)]), -1, (0, 255, 0), 3)

    # --- SETUP FOR THE DYNAMIC DISPLAY LOOP ---    

    print("Displaying visualization. Resize the window with your mouse.")
    print("Press 'q' or ESC to close.")
    
    cv2.imshow("Binary Image", imutils.resize(image_with_contours, width=600))
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    cv2.destroyAllWindows()
    print("Window closed.")


if __name__ == "__main__":
    main()
