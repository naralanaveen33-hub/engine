# 13 — Crop ML Model

## Purpose

Train and serve a real Random Forest; persist metrics; never hardcode accuracy.

## Scope

Classification of crop **label** from the seven dataset features. Not irrigation. Not market.

## Architecture

```
inspect → preprocess (no target leakage) → train RF → evaluate test → joblib + model_versions row
CropAnalysisEngine calls model.predict_proba
```

## Inputs

Seven numeric features from SoilService + Weather/Climate mapping. If any required feature missing, model skipped.

## Outputs

`predict_proba` per class; mapped to 0–100 as `ml_score`. `source=MODEL_OUTPUT`. Feature importances stored.

## Data Flow

`ml/train.py` writes `ml/artifacts/crop_rf_v1.joblib` and `metrics.json`. API loads at startup.

## Dependencies

scikit-learn RandomForestClassifier. Hyperparameters recorded (n_estimators, max_depth, random_state=42, class_weight if used). Chosen because tabular, small n, built-in importances — not because it is fashionable.

## Failure Cases

Artifact missing: engine rules-only. Version mismatch: refuse silent feature pad.

## Security

Model files from repo only; no pickle from internet at runtime.

## MVP Implementation

```
RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1)
```

Metrics: accuracy, macro-F1, per-class F1 on test. Display those numbers only.

## Production Extension

Spatial cross-validation; calibration plots; reject out-of-distribution soils.

## Testing

Preprocess unit tests; freeze a tiny fixture dataset for CI.

## Limitations

Educational dataset ≠ agronomic recommendation system. High test accuracy on this CSV is **in-distribution classification**, not field success probability.
