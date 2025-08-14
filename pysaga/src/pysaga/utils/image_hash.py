from PIL import Image
import imagehash

from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3] 

# --- Configuration ---
# Point this to the folder where you saved your clean template images
TEMPLATE_DIR = 'templates'
COLOR_TEMPLATE_FILE = {
    "upright": 'kodak_color.tif',
    "neg90" : 'kodak_color_neg_90.tif',
    'neg180': 'kodak_color_neg_180.tif',
    'pos90': 'kodak_color_pos_90.tif'
}
GRAY_TEMPLATE_FILE = {
    "upright": 'kodak_gray.tif',
    "neg90" : 'kodak_gray_neg_90.tif',
    'neg180': 'kodak_gray_neg_180.tif',
    'pos90': 'kodak_gray_pos_90.tif'
}

def generate_hash(file_path):
    """Opens an image, computes its perceptual hash, and returns it."""
    with Image.open(file_path) as img:
        # pHash is excellent for this type of visual fingerprinting
        hash_value = imagehash.phash(img)
        return hash_value


def compare_with_templates(input_image, template_dir, orientation_templates):
    """returns the distance between the input image and the kodak gray template images."""
    result = {}
    for orientation in orientation_templates:
        file_path = ROOT_DIR.joinpath(template_dir, orientation_templates[orientation]).absolute()
        target_hash = generate_hash(file_path)
        input_hash = imagehash.phash(input_image)

        result[orientation] = input_hash - target_hash

    return result


def compare_with_color_templates(input_image):
    return compare_with_templates(
        input_image, TEMPLATE_DIR, COLOR_TEMPLATE_FILE
    )

def compare_with_gray_templates(input_image):
    return compare_with_templates(
        input_image, TEMPLATE_DIR, GRAY_TEMPLATE_FILE
    )
