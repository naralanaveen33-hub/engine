"""
Real Inference Test Script for AquaCrop Step 1
Loads ml/artifacts/crop_rf_v1.joblib independently and verifies predictions.
"""
import json
from pathlib import Path
import joblib
import numpy as np

ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "artifacts" / "crop_rf_v1.joblib"
METRICS_PATH = ROOT / "artifacts" / "metrics.json"

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

def run_inference_tests():
    print("=== REAL INFERENCE TEST ===")
    assert MODEL_PATH.exists(), f"Model artifact missing: {MODEL_PATH}"
    assert METRICS_PATH.exists(), f"Metrics artifact missing: {METRICS_PATH}"

    # 1. Load model artifact
    model = joblib.load(MODEL_PATH)
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    print(f"Loaded Model Version: {metrics.get('model_version')}")
    print(f"Algorithm: {metrics.get('algorithm')}")
    print(f"Target Classes ({len(model.classes_)}): {list(model.classes_)}")

    # 2. Test Samples
    test_samples = [
        {
            "name": "High Rainfall (Rice-like)",
            "features": [90, 42, 43, 20.8, 82.0, 6.5, 202.9],
        },
        {
            "name": "Low Moisture Legume (Chickpea-like)",
            "features": [40, 60, 80, 18.0, 16.0, 7.0, 70.0],
        },
        {
            "name": "Medium Nutrients (Maize-like)",
            "features": [70, 48, 20, 22.5, 65.0, 6.2, 80.0],
        },
        {
            "name": "Fruit Tree (Banana-like)",
            "features": [100, 75, 50, 27.0, 80.0, 6.0, 100.0],
        },
        {
            "name": "Commercial (Coffee-like)",
            "features": [100, 25, 30, 26.0, 90.0, 5.5, 180.0],
        },
    ]

    all_passed = True
    for i, sample in enumerate(test_samples, 1):
        import pandas as pd
        x = pd.DataFrame([sample["features"]], columns=FEATURES)
        pred_class = model.predict(x)[0]
        proba = model.predict_proba(x)[0]


        # Validation assertions
        assert pred_class in model.classes_, f"Predicted class {pred_class} not in target classes"
        assert not np.isnan(proba).any(), "Probabilities contain NaN"
        assert not np.isinf(proba).any(), "Probabilities contain Inf"
        assert abs(sum(proba) - 1.0) < 1e-4, f"Probabilities do not sum to 1.0: {sum(proba)}"

        top_indices = np.argsort(proba)[::-1][:3]
        top_crops = [(model.classes_[idx], float(proba[idx])) for idx in top_indices]

        print(f"\nSample {i} [{sample['name']}]:")
        print(f"  Inputs: {dict(zip(FEATURES, sample['features']))}")
        print(f"  Top Prediction: '{pred_class}' (Probability: {max(proba):.4f})")
        print(f"  Top 3 Candidates: {top_crops}")

    print("\nInference Test Result: PASS")
    return all_passed

if __name__ == "__main__":
    run_inference_tests()
