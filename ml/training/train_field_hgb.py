"""
KisanAI - Real-Field HistGradientBoosting Model Trainer
Trains on real Paddy Doctor images (2,000+ images) using exact 14-feature multi-spectral extraction.
Exports:
1. public/models/rice_hgb_model.json (for 100% offline in-browser execution)
2. ml/training/checkpoints/rice_hgb_model.joblib (for local_ai_server.py)
"""

import os
import glob
import json
import joblib
import numpy as np
from PIL import Image
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
PADDY_DIR = os.path.join(REPO_ROOT, "ml/datasets/data/paddy_doctor_raw")
JSON_EXPORT_PATH = os.path.join(REPO_ROOT, "public/models/rice_hgb_model.json")
JOBLIB_EXPORT_PATH = os.path.join(REPO_ROOT, "ml/training/checkpoints/rice_hgb_model.joblib")

# Class mapping from dataset folder to app slug
PADDY_MAP = [
    ("blast", "rice-blast"),
    ("brown_spot", "brown-spot"),
    ("bacterial_leaf_blight", "bacterial-leaf-blight"),
    ("bacterial_leaf_streak", "bacterial-leaf-streak"),
    ("tungro", "tungro"),
    ("hispa", "hispa"),
    ("downy_mildew", "downy-mildew"),
    ("stem_borer", "yellow-stem-borer"),
    ("normal", "rice-healthy"),
]

CLASSES = [slug for _, slug in PADDY_MAP]

def extract_14_features(pil_im: Image.Image) -> list:
    W, H = 256, 256
    im = pil_im.convert("RGB").resize((W, H), Image.Resampling.BILINEAR)
    arr = np.array(im, dtype=np.float32) / 255.0
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    total_pixels = W * H

    # Means and standard deviations
    meanR = float(r.mean())
    meanG = float(g.mean())
    meanB = float(b.mean())
    stdR = float(r.std())
    stdG = float(g.std())
    stdB = float(b.std())
    meanDiffRG = float(np.abs(r - g).mean())

    # Multi-spectral foliar pathology pixel masks matching vision.ts
    isFoliar = (g > r * 1.05) & (g > b * 1.05) & (g > 0.15)
    isYellow = (r > 0.38) & (g > 0.35) & (b < 0.28) & (r > b * 1.3)
    isBrown = (r > 0.24) & (g < r * 0.92) & (b < 0.24) & (r > b * 1.3)
    isAsh = (np.abs(r - g) < 0.07) & (np.abs(g - b) < 0.07) & (r > 0.35) & (r < 0.70)
    isWhite = (r > 0.65) & (g > 0.65) & (b > 0.60) & (isFoliar | isYellow)

    # Margins (outer 20%)
    maskMargin = np.zeros((H, W), dtype=bool)
    maskMargin[:51, :] = True
    maskMargin[-51:, :] = True
    maskMargin[:, :51] = True
    maskMargin[:, -51:] = True

    foliarCount = float(isFoliar.sum())
    yellowTissueCount = float(isYellow.sum())
    brownLesionCount = float(isBrown.sum())
    ashCoreCount = float(isAsh.sum())
    whiteStreakCount = float(isWhite.sum())
    marginalYellowCount = float((isYellow & maskMargin).sum())
    marginalBrownCount = float((isBrown & maskMargin).sum())

    return [
        foliarCount / total_pixels,
        yellowTissueCount / total_pixels,
        brownLesionCount / total_pixels,
        ashCoreCount / total_pixels,
        whiteStreakCount / total_pixels,
        marginalYellowCount / total_pixels,
        marginalBrownCount / total_pixels,
        meanR,
        meanG,
        meanB,
        stdR,
        stdG,
        stdB,
        meanDiffRG
    ]

def train():
    print("=" * 70)
    print("Training Real-Field HistGradientBoosting Model on Paddy Doctor")
    print("=" * 70)

    X, Y = [], []
    for dir_name, slug in PADDY_MAP:
        cls_idx = CLASSES.index(slug)
        folder = os.path.join(PADDY_DIR, dir_name)
        files = glob.glob(os.path.join(folder, "*.jpg")) + glob.glob(os.path.join(folder, "*.JPG"))
        np.random.seed(42)
        np.random.shuffle(files)
        selected = files # full real field dataset across all classes
        print(f"  Class {cls_idx} ({slug:22}): {len(selected)} photos from '{dir_name}'")
        for f in selected:
            try:
                with Image.open(f) as im:
                    X.append(extract_14_features(im))
                    Y.append(cls_idx)
            except Exception as e:
                pass

    X = np.array(X, dtype=np.float32)
    Y = np.array(Y, dtype=np.int64)
    print(f"\nTotal Dataset: {len(Y)} samples across {len(CLASSES)} classes.")

    X_train, X_test, Y_train, Y_test = train_test_split(
        X, Y, test_size=0.18, random_state=42, stratify=Y
    )

    clf = HistGradientBoostingClassifier(
        max_iter=130,
        min_samples_leaf=6,
        l2_regularization=0.2,
        learning_rate=0.09,
        random_state=42
    )
    clf.fit(X_train, Y_train)

    Y_pred = clf.predict(X_test)
    acc = accuracy_score(Y_test, Y_pred)
    print(f"\nTest Accuracy on Real Paddy Images: {acc * 100:.2f}%\n")
    print(classification_report(Y_test, Y_pred, target_names=CLASSES))

    # Save Joblib
    os.makedirs(os.path.dirname(JOBLIB_EXPORT_PATH), exist_ok=True)
    joblib.dump(clf, JOBLIB_EXPORT_PATH)
    print(f"Saved server model to: {JOBLIB_EXPORT_PATH}")

    # Export to JSON format for in-browser client evaluation
    trees_json = []
    K = len(CLASSES)
    for iteration_predictors in clf._predictors:
        iteration_trees = []
        for k in range(K):
            predictor = iteration_predictors[k]
            tree_nodes = []
            for node in predictor.nodes:
                tree_nodes.append({
                    "feat": int(node["feature_idx"]),
                    "thresh": float(node["num_threshold"]),
                    "left": int(node["left"]),
                    "right": int(node["right"]),
                    "val": float(node["value"]),
                    "leaf": bool(node["is_leaf"])
                })
            iteration_trees.append(tree_nodes)
        trees_json.append(iteration_trees)

    hgb_payload = {
        "classes": CLASSES,
        "num_features": 14,
        "num_iterations": len(clf._predictors),
        "trees": trees_json
    }

    os.makedirs(os.path.dirname(JSON_EXPORT_PATH), exist_ok=True)
    with open(JSON_EXPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(hgb_payload, f, separators=(",", ":"))
    print(f"Exported client JSON model to: {JSON_EXPORT_PATH} ({os.path.getsize(JSON_EXPORT_PATH):,} bytes)")

if __name__ == "__main__":
    train()
