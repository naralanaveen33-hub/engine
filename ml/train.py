"""Train Random Forest if a real CSV is present. Never invent accuracy."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split

FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "crop_recommendation.csv"
ART = ROOT / "artifacts"


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    return h.hexdigest()


def main() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    if not DATA.exists():
        card = {
            "model_id": "crop_rf",
            "status": "UNAVAILABLE",
            "limitations": "Dataset file missing. Place crop_recommendation.csv in ml/data/. Crop analysis will use rules only.",
        }
        (ART / "metrics.json").write_text(json.dumps(card, indent=2), encoding="utf-8")
        print("NO DATASET — model not trained. See ml/artifacts/metrics.json")
        return

    df = pd.read_csv(DATA)
    cols = {c.lower(): c for c in df.columns}
    rename = {}
    for f in FEATURES:
        if f in df.columns:
            continue
        if f.lower() in cols:
            rename[cols[f.lower()]] = f
    if "label" in df.columns:
        target = "label"
    elif "crop" in df.columns:
        target = "crop"
    else:
        raise SystemExit("No label/crop column")
    df = df.rename(columns=rename)
    missing = [f for f in FEATURES if f not in df.columns]
    if missing:
        raise SystemExit(f"Missing columns {missing}")
    print("rows", len(df), "classes", df[target].nunique(), "nulls", int(df[FEATURES + [target]].isna().sum().sum()))
    X = df[FEATURES]
    y = df[target].astype(str).str.lower()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    params = {"n_estimators": 200, "max_depth": 12, "random_state": 42, "n_jobs": -1}
    clf = RandomForestClassifier(**params)
    clf.fit(X_train, y_train)
    pred = clf.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, pred)),
        "macro_f1": float(f1_score(y_test, pred, average="macro")),
        "report": classification_report(y_test, pred, output_dict=True),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "feature_importance": dict(zip(FEATURES, [float(x) for x in clf.feature_importances_])),
    }
    joblib.dump(clf, ART / "crop_rf_v1.joblib")
    card = {
        "model_id": "crop_rf",
        "model_name": "Crop recommendation Random Forest",
        "version": "1.0.0",
        "dataset": str(DATA),
        "dataset_sha256": _sha256(DATA),
        "training_date": datetime.now(timezone.utc).isoformat(),
        "features": FEATURES,
        "target": target,
        "metrics": {"accuracy": metrics["accuracy"], "macro_f1": metrics["macro_f1"], "n_test": metrics["n_test"]},
        "parameters": params,
        "status": "TRAINED",
        "limitations": "Educational public crop-recommendation table. Not a validated Andhra yield model. Extra app features were not inserted into the model.",
        **metrics,
    }
    (ART / "metrics.json").write_text(json.dumps(card, indent=2), encoding="utf-8")
    print("TEST accuracy", metrics["accuracy"], "macro_f1", metrics["macro_f1"])


if __name__ == "__main__":
    main()
