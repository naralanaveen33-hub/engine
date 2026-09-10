# 13 — Crop ML Model & Technical Specification

## Overview

AquaCrop utilizes a Random Forest classifier trained on validated agricultural data to predict crop suitability signals from environmental and soil features. The model produces a machine-readable probability distribution across 22 crop classes, which is subsequently combined with deterministic agronomic rules (crop rotation, water availability, seasonal calendars, market signals) in the Crop Analysis Engine.

---

## 1. Dataset Specification

- **Source:** Open-Source Public Crop Recommendation Dataset (`ml/data/crop_recommendation.csv`)
- **License:** CC0 Public Domain / Open Educational Dataset
- **Dataset Size:** 2,200 total rows, 8 columns
- **Missing Values:** 0 null cells (0.0%)
- **Duplicate Rows:** 0 duplicate rows (0.0%)
- **Target Variable:** `label` (22 distinct crop classes, exactly 100 balanced samples per class)
- **Target Classes:** `apple`, `banana`, `blackgram`, `chickpea`, `coconut`, `coffee`, `cotton`, `grapes`, `jute`, `kidneybeans`, `lentil`, `maize`, `mango`, `mothbeans`, `mungbean`, `muskmelon`, `orange`, `papaya`, `pigeonpeas`, `pomegranate`, `rice`, `watermelon`

### Feature List (7 Numeric Features)
1. `N`: Ratio of Nitrogen content in soil ($0 - 140$)
2. `P`: Ratio of Phosphorus content in soil ($5 - 145$)
3. `K`: Ratio of Potassium content in soil ($5 - 205$)
4. `temperature`: Temperature in °C ($8.8 - 43.7^\circ\text{C}$)
5. `humidity`: Relative humidity in % ($14.3 - 100.0\%$)
6. `ph`: Soil pH value ($3.5 - 9.9$)
7. `rainfall`: Rainfall in mm ($20.2 - 298.6\text{ mm}$)

---

## 2. Training Procedure & Hyperparameters

- **Algorithm:** `sklearn.ensemble.RandomForestClassifier`
- **Train / Test Split:** Stratified 80% Train (1,760 samples), 20% Test (440 samples)
- **Random Seed:** `42` (fixed for strict reproducibility)
- **Hyperparameters:**
  - `n_estimators`: 200
  - `max_depth`: 12
  - `random_state`: 42
  - `n_jobs`: -1

---

## 3. Measured Evaluation Metrics (Held-Out Test Set)

Evaluated strictly on the 440 held-out test samples:

- **Accuracy:** `0.9932` (99.32%)
- **Precision (Macro):** `0.9932`
- **Recall (Macro):** `0.9932`
- **F1 Score (Macro):** `0.9932`
- **Precision (Weighted):** `0.9932`
- **Recall (Weighted):** `0.9932`
- **F1 Score (Weighted):** `0.9932`

*All metrics are automatically calculated and stored in [`ml/artifacts/metrics.json`](file:///d:/engine/ml/artifacts/metrics.json).*

---

## 4. Measured Feature Importances

| Feature | Description | Importance | Percentage |
| --- | --- | --- | --- |
| `rainfall` | Annual/seasonal rainfall (mm) | `0.2239` | 22.39% |
| `humidity` | Relative humidity (%) | `0.2151` | 21.51% |
| `K` | Potassium ratio in soil | `0.1791` | 17.91% |
| `P` | Phosphorus ratio in soil | `0.1528` | 15.28% |
| `N` | Nitrogen ratio in soil | `0.1065` | 10.65% |
| `temperature` | Ambient temperature (°C) | `0.0729` | 7.29% |
| `ph` | Soil pH level | `0.0498` | 4.98% |

---

## 5. Model Artifacts & Serving

- **Model Binary Artifact:** [`ml/artifacts/crop_rf_v1.joblib`](file:///d:/engine/ml/artifacts/crop_rf_v1.joblib)
- **Metrics Artifact:** [`ml/artifacts/metrics.json`](file:///d:/engine/ml/artifacts/metrics.json)
- **Model Version Label:** `crop_rf_v1` (1.0.0)

### Serving Architecture
The backend engine [`backend/app/engines/crop_analysis.py`](file:///d:/engine/backend/app/engines/crop_analysis.py) loads `crop_rf_v1.joblib` at startup. If the model artifact is present and all 7 required numeric features are available, `predict_proba` produces class probabilities mapped to 0–100 suitability scores. If missing or incomplete, the engine gracefully falls back to `rules-only-v1` and flags `ml_status = UNAVAILABLE`.

---

## 6. Scientific Limitations & Exclusions

1. **In-Distribution Classification:** The measured 99.32% test accuracy reflects high tabular discriminability on the dataset features. It is a suitability indicator, NOT a guaranteed field yield or profit forecast.
2. **Features Intentionally Excluded from ML Model:** Fields such as location coordinates, crop rotation history, water infrastructure, field area, farmer preferences, and market prices are **intentionally excluded** from the ML model because the training dataset does not contain them. These features are evaluated downstream in the deterministic Crop Analysis Engine rule layers to maintain scientific honesty.

---

## 7. Retraining Instructions

To retrain the model or update artifacts:

```bash
python ml/train.py
```

To run independent real inference verification:

```bash
python ml/test_inference.py
```
