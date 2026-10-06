from flask import Flask, request, jsonify
from flask_cors import CORS

import cv2
import numpy as np
import base64
import time


app = Flask(__name__)
CORS(app)


@app.route("/api/v1/analyze", methods=["POST"])
def analyze():

    start_time = time.time()

    # ---------------------------------------------------------
    # Upload image
    # ---------------------------------------------------------

    if "file" not in request.files:
        return jsonify({
            "error": "No image file provided"
        }), 400

    file = request.files["file"]

    image_bytes = np.frombuffer(
        file.read(),
        np.uint8
    )

    image = cv2.imdecode(
        image_bytes,
        cv2.IMREAD_COLOR
    )

    if image is None:
        return jsonify({
            "error": "Invalid image"
        }), 400


    # ---------------------------------------------------------
    # Original image dimensions
    # ---------------------------------------------------------

    height, width = image.shape[:2]


    # ---------------------------------------------------------
    # 1. Convert to grayscale
    # ---------------------------------------------------------

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )


    # ---------------------------------------------------------
    # 2. Gaussian Blur
    # ---------------------------------------------------------

    blurred = cv2.GaussianBlur(
        gray,
        (5, 5),
        0
    )


    # ---------------------------------------------------------
    # 3. CLAHE
    # ---------------------------------------------------------

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(
        blurred
    )


    # ---------------------------------------------------------
    # 4. Infrastructure Region of Interest
    #
    # Same ROI used in the Colab:
    #   Y: 20% -> 80%
    #   X: 10% -> 90%
    # ---------------------------------------------------------

    roi_y1 = int(height * 0.20)
    roi_y2 = int(height * 0.80)

    roi_x1 = int(width * 0.10)
    roi_x2 = int(width * 0.90)

    roi = enhanced[
        roi_y1:roi_y2,
        roi_x1:roi_x2
    ]


    # ---------------------------------------------------------
    # 5. Black-Hat Transformation
    # ---------------------------------------------------------

    roi_kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (15, 15)
    )

    roi_blackhat = cv2.morphologyEx(
        roi,
        cv2.MORPH_BLACKHAT,
        roi_kernel
    )


    # ---------------------------------------------------------
    # 6. 95th Percentile Threshold
    #
    # This is the final threshold used in the Colab.
    # ---------------------------------------------------------

    threshold_value = np.percentile(
        roi_blackhat,
        95
    )

    _, crack_mask_strict = cv2.threshold(
        roi_blackhat,
        threshold_value,
        255,
        cv2.THRESH_BINARY
    )


    # ---------------------------------------------------------
    # 7. Morphological Closing
    # ---------------------------------------------------------

    clean_kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (3, 3)
    )

    final_mask = cv2.morphologyEx(
        crack_mask_strict,
        cv2.MORPH_CLOSE,
        clean_kernel
    )


    # ---------------------------------------------------------
    # 8. Connected Components
    #
    # The Colab uses min_area = 8.
    # ---------------------------------------------------------

    num_labels, labels, stats, centroids = (
        cv2.connectedComponentsWithStats(
            final_mask,
            connectivity=8
        )
    )

    filtered_mask = np.zeros_like(
        final_mask
    )

    regions = []

    min_area = 8

    for i in range(1, num_labels):

        area = int(
            stats[i, cv2.CC_STAT_AREA]
        )

        if area >= min_area:

            filtered_mask[
                labels == i
            ] = 255

            x = int(
                stats[i, cv2.CC_STAT_LEFT]
            )

            y = int(
                stats[i, cv2.CC_STAT_TOP]
            )

            w = int(
                stats[i, cv2.CC_STAT_WIDTH]
            )

            h = int(
                stats[i, cv2.CC_STAT_HEIGHT]
            )

            if area > 500:
                response = "High"

            elif area > 150:
                response = "Medium"

            else:
                response = "Low"

            regions.append({
                "id": len(regions) + 1,
                "area": area,
                "bbox": [
                    x + roi_x1,
                    y + roi_y1,
                    w,
                    h
                ],
                "response": response
            })


    # ---------------------------------------------------------
    # 9. Create FULL-SIZE mask
    #
    # The Colab displays the ROI mask.
    # Here we place that same ROI result back into
    # the original image coordinates so React can display it.
    # ---------------------------------------------------------

    full_mask = np.zeros(
        (height, width),
        dtype=np.uint8
    )

    full_mask[
        roi_y1:roi_y2,
        roi_x1:roi_x2
    ] = filtered_mask


    # ---------------------------------------------------------
    # 10. Calculate crack coverage
    #
    # Same concept as the Colab:
    # pixels detected / ROI pixels
    # ---------------------------------------------------------

    total_pixels = (
        filtered_mask.shape[0] *
        filtered_mask.shape[1]
    )

    crack_pixels = np.count_nonzero(
        filtered_mask
    )

    crack_percentage = (
        crack_pixels /
        total_pixels
    ) * 100


    # ---------------------------------------------------------
    # 11. Encode mask as PNG
    # ---------------------------------------------------------

    _, encoded_mask = cv2.imencode(
        ".png",
        full_mask
    )

    mask_base64 = base64.b64encode(
        encoded_mask
    ).decode("utf-8")

    mask_data_url = (
        "data:image/png;base64,"
        + mask_base64
    )


    # ---------------------------------------------------------
    # 12. Processing time
    # ---------------------------------------------------------

    processing_time = (
        time.time() - start_time
    )


    # ---------------------------------------------------------
    # 13. Return result to React
    # ---------------------------------------------------------

    return jsonify({

        "processed_image": None,

        "mask": mask_data_url,

        "region_count": len(regions),

        "coverage_percent": round(
            crack_percentage,
            2
        ),

        "processing_time": round(
            processing_time,
            2
        ),

        "resolution": {
            "width": width,
            "height": height
        },

        "regions": regions

    })


@app.route("/")
def home():

    return jsonify({
        "message": "CrackVision Backend is running"
    })


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )