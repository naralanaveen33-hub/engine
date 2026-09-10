"""
AquaCrop Crop Recommendation ML Model Training & Evaluation Pipeline (Step 1)
Trains a Random Forest classifier on validated crop_recommendation.csv data.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "crop_recommendation.csv"
ART = ROOT / "artifacts"


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def train_and_evaluate():
    ART.mkdir(parents=True, exist_ok=True)
    if not DATA.exists():
        card = {
            "model_id": "crop_rf",
            "status": "UNAVAILABLE",
            "limitations": "Dataset file missing. Place crop_recommendation.csv in ml/data/. Crop analysis will use rules only.",
        }
        (ART / "metrics.json").write_text(json.dumps(card, indent=2), encoding="utf-8")
        print("DATASET REQUIRED: ml/data/crop_recommendation.csv")
        return False

    df = pd.read_csv(DATA)
    
    # Dataset validation checks
    assert len(df) > 0, "Dataset is empty"
    target = "label" if "label" in df.columns else "crop"
    assert target in df.columns, f"Target column '{target}' not found"
    for f in FEATURES:
        assert f in df.columns, f"Feature '{f}' not found in dataset"

    print(f"Dataset validated: {len(df)} rows, {len(FEATURES)} features, target '{target}'")

    X = df[FEATURES]
    y = df[target].astype(str).str.lower().str.strip()
    class_names = sorted(list(y.unique()))

    # Stratified 80/20 train/test split
    random_seed = 42
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=random_seed, stratify=y
    )

    hyperparameters = {
        "n_estimators": 200,
        "max_depth": 12,
        "random_state": random_seed,
        "n_jobs": -1,
    }

    clf = RandomForestClassifier(**hyperparameters)
    clf.fit(X_train, y_train)

    # Evaluate strictly on held-out test data
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    macro_prec = float(precision_score(y_test, y_pred, average="macro"))
    macro_rec = float(recall_score(y_test, y_pred, average="macro"))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))

    weighted_prec = float(precision_score(y_test, y_pred, average="weighted"))
    weighted_rec = float(recall_score(y_test, y_pred, average="weighted"))
    weighted_f1 = float(f1_score(y_test, y_pred, average="weighted"))

    cm = confusion_matrix(y_test, y_pred, labels=class_names).tolist()
    report_dict = classification_report(y_test, y_pred, output_dict=True)

    feature_importance = {
        feat: float(imp)
        for feat, imp in zip(FEATURES, clf.feature_importances_)
    }

    # Save model artifact
    model_path = ART / "crop_rf_v1.joblib"
    joblib.dump(clf, model_path)

    # Compile comprehensive metrics card
    card = {
        "model_id": "crop_rf",
        "model_name": "Crop Recommendation Random Forest Classifier",
        "version": "1.0.0",
        "model_version": "crop_rf_v1",
        "algorithm": "RandomForestClassifier",
        "dataset_name": "crop_recommendation.csv",
        "dataset_path": str(DATA),
        "dataset_sha256": _sha256(DATA),
        "dataset_size": int(len(df)),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "random_seed": random_seed,
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "feature_names": FEATURES,
        "target_name": target,
        "class_names": class_names,
        "hyperparameters": hyperparameters,
        "metrics": {
            "accuracy": acc,
            "precision_macro": macro_prec,
            "recall_macro": macro_rec,
            "f1_macro": macro_f1,
            "precision_weighted": weighted_prec,
            "recall_weighted": weighted_rec,
            "f1_weighted": weighted_f1,
        },
        "accuracy": acc,
        "precision": weighted_prec,
        "recall": weighted_rec,
        "f1": weighted_f1,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "confusion_matrix": cm,
        "feature_importance": feature_importance,
        "per_class_report": report_dict,
        "status": "TRAINED",
        "limitations": "Educational public crop-recommendation table (2200 rows, 22 crops). Not a validated regional soil yield model. Features intentionally excluded from ML model: location, season, soil texture, previous crop, market prices, field area (managed by downstream agricultural rules engine).",
    }

    metrics_path = ART / "metrics.json"
    metrics_path.write_text(json.dumps(card, indent=2), encoding="utf-8")

    print("\n=== MODEL TRAINING AND EVALUATION SUMMARY ===")
    print(f"Model saved to: {model_path}")
    print(f"Metrics saved to: {metrics_path}")
    print(f"Accuracy: {acc:.4f}")
    print(f"Macro F1: {macro_f1:.4f}")
    print(f"Weighted F1: {weighted_f1:.4f}")
    print("\nFeature Importances:")
    for feat, imp in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
        print(f"  {feat}: {imp:.4f}")
    return True


if __name__ == "__main__":
    train_and_evaluate()
