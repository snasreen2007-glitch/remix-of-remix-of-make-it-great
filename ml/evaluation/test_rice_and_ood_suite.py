import os
import sys
import glob
from PIL import Image
import numpy as np

sys.path.insert(0, os.path.abspath("."))
from ml.severity.hierarchical_vision import analyze_botanical_quality, hierarchical_predict

user_dir = r"C:\Users\ayubh\.gemini\antigravity\brain\b16240c9-8a23-4f63-b009-2f988f0613b2\.user_uploaded"
selfie_path = os.path.join(user_dir, "media_1795416773199_1f8a300d.jpg")

if os.path.exists(selfie_path):
    with Image.open(selfie_path) as im:
        q = analyze_botanical_quality(im)
        res = hierarchical_predict(im, crop="rice")
        print("Selfie image analysis with current Python pipeline:")
        print("  Quality:", q)
        print("  Outcome:", res.get("diagnosis_status"), res.get("topicSlug"), res.get("confidence"))
else:
    print("Selfie not found at", selfie_path)
