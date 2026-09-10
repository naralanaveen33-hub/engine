# ML Model Specification

See [13_CROP_ML_MODEL.md](file:///d:/engine/docs/13_CROP_ML_MODEL.md) for full details.

## Quick Summary
- **Model:** Random Forest Classifier (`crop_rf_v1`)
- **Dataset:** `ml/data/crop_recommendation.csv` (2,200 rows, 22 classes)
- **Artifacts:** `ml/artifacts/crop_rf_v1.joblib` and `ml/artifacts/metrics.json`
- **Measured Accuracy:** 99.32% on held-out test data
- **Features:** N, P, K, temperature, humidity, ph, rainfall
- **Retrain Command:** `python ml/train.py`
- **Inference Verification:** `python ml/test_inference.py`
