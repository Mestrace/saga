import numpy as np
import cv2
from pysaga.api.master_to_mezz import find_objects_white_background


def test_find_all_objects_with_none():
    contours = find_objects_white_background(None)
    assert contours is None

def test_find_all_objects_with_invalid_type():
    contours = find_objects_white_background("not an image")
    assert contours is None

def test_find_all_objects_with_blank_image():
    blank = np.full((100, 100, 3), 255, dtype=np.uint8)
    contours = find_objects_white_background(blank)
    assert isinstance(contours, list)
    # Should find 0 or 1 contour depending on thresholding
    assert len(contours) <= 1

def test_find_all_objects_with_simple_shape():
    img = np.full((100, 100, 3), 255, dtype=np.uint8)
    cv2.rectangle(img, (20, 20), (80, 80), (110, 110, 110), -1)
    contours = find_objects_white_background(img)
    assert isinstance(contours, list)
    # Should find at least one contour for the rectangle
    assert len(contours) >= 1

def test_find_all_objects_with_multiple_shapes():
    img = np.full((100, 100, 3), 255, dtype=np.uint8)
    cv2.circle(img, (20, 20), 10, (130, 130, 130), -1)  # Top-left
    cv2.rectangle(img, (70, 70), (90, 90), (120, 120, 120), -1)  # Bottom-right, far from circle
    contours = find_objects_white_background(img)
    assert isinstance(contours, list)
    # Should find at least two contours
    assert len(contours) >= 2