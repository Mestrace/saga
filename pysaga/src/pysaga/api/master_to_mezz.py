import cv2
import logging
import numpy as np
import imutils


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def find_objects_white_background(image):
    """
    Processes an image array and finds the contours of all objects.

    Args:
        image (numpy.ndarray): The image loaded in memory.

    Returns:
            contours (list): A list of all contours found in the image.
    Returns None if the image is invalid.
    """
    try:
        if image is None:
            logging.error("Input image is None.")
            return None

        if not hasattr(image, "shape"):
            logging.error("Input is not a valid numpy array.")
            return None

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        blurred = cv2.GaussianBlur(gray, (5, 5), 0)


        # Use THRESH_BINARY since background is white
        _, binary_image = cv2.threshold(
            blurred, 240, 255, cv2.THRESH_BINARY_INV
        )

        # 3. Define a kernel for the morphological operation.
        # A larger kernel (e.g., (7,7) or (9,9)) will close larger gaps.
        kernel = np.ones((5, 5), np.uint8)
        
        # Apply the closing operation. The 'iterations' parameter can also be increased
        # to make the effect stronger.
        closed_image = cv2.morphologyEx(binary_image, cv2.MORPH_CLOSE, kernel, iterations=2)

        # 4. Find contours on the CLEANED image
        initial_contours, _ = cv2.findContours(
            closed_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE # Pass the cleaned image here
        )

        # compute contour area
        img_height, img_width = image.shape[:2]
        total_image_area = img_height * img_width
        min_contour_area = total_image_area * 0.0005  # 0.05%

        # 2. Create a new list to hold only the contours that are large enough.
        filtered_contours = []
        for contour in initial_contours:
            # Calculate the area of the current contour
            area = cv2.contourArea(contour)
            
            # 3. Keep the contour only if its area is larger than our threshold
            if area > min_contour_area:
                filtered_contours.append(contour)

        logging.info(f"Kept {len(filtered_contours)} contours after filtering out smaller than {min_contour_area:.2f} (0.05% of image).")

        # Ensure contours is always a list
        if not isinstance(filtered_contours, list):
            filtered_contours = list(filtered_contours)

        return filtered_contours

    except cv2.error as e:
        logging.error(f"OpenCV error: {e}")
        return None
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        return None

