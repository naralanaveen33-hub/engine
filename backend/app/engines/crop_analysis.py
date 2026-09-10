from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np

from app.engines.rotation import rotation_delta

RULE_VERSION = "crop-analysis-rules-v1"
FEATURES = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]

_model = None
_model_meta: dict = {"status": "UNAVAILABLE"}


def load_model() -> None:
    global _model, _model_meta
    root = Path(__file__).resolve().parents[2].parent / "ml" / "artifacts"
    path = root / "crop_rf_v1.joblib"
    meta_path = root / "metrics.json"
    if path.exists():
        _model = joblib.load(path)
        _model_meta = {"status": "TRAINED", "path": str(path)}
        if meta_path.exists():
            import json
            _model_meta.update(json.loads(meta_path.read_text(encoding="utf-8")))
    else:
        _model = None
        _model_meta = {"status": "UNAVAILABLE", "note": "No trained artifact. Crop analysis uses rules only."}


def model_meta() -> dict:
    return dict(_model_meta)


def _season_delta(crop_season: str, month: int) -> tuple[float, str | None]:
    # Kharif ~ Jun-Oct, Rabi ~ Nov-Mar, Both always 0
    kharif = month in (6, 7, 8, 9, 10)
    rabi = month in (11, 12, 1, 2, 3)
    s = (crop_season or "BOTH").upper()
    if s == "BOTH":
        return 0.0, None
    if s == "KHARIF" and not kharif:
        return -10.0, "Off typical kharif window (simplified calendar)."
    if s == "RABI" and not rabi:
        return -10.0, "Off typical rabi window (simplified calendar)."
    return 3.0, "Season window matches simplified calendar."


def analyze_crops(
    *,
    catalog: list[dict],
    n: float | None,
    p: float | None,
    k: float | None,
    temperature: float | None,
    humidity: float | None,
    ph: float | None,
    rainfall: float | None,
    feature_sources: dict,
    previous_code: str | None,
    history_status: str,
    water_availability: str,
    farmer_preference: str | None,
    market_bonus: dict[str, float],
    month: int,
) -> dict:
    ml_ok = (
        _model is not None
        and all(v is not None for v in (n, p, k, temperature, humidity, ph, rainfall))
    )
    ml_scores: dict[str, float] = {}
    warnings_global: list[str] = []
    if ml_ok:
        import pandas as pd
        x = pd.DataFrame([[n, p, k, temperature, humidity, ph, rainfall]], columns=FEATURES)
        proba = _model.predict_proba(x)[0]

        classes = list(_model.classes_)
        for c, pr in zip(classes, proba):
            ml_scores[str(c).lower()] = float(pr) * 100.0
        model_version = _model_meta.get("version", "crop_rf_v1")
    else:
        model_version = None
        if _model is None:
            warnings_global.append("ML_UNAVAILABLE")
        else:
            warnings_global.append("ML_FEATURES_INCOMPLETE")

    recs = []
    for crop in catalog:
        code = crop["code"]
        if ml_ok and code in ml_scores:
            base = ml_scores[code]
            positives = ["Random Forest class probability on dataset features (not yield)."]
            negatives: list[str] = []
        else:
            base = 50.0
            positives = []
            negatives = []
            if not ml_ok:
                negatives.append("No in-model score; baseline 50 used before rules.")

        d_rot, p_rot, n_rot = rotation_delta(previous_code if history_status == "KNOWN" else None, code)
        positives += p_rot
        negatives += n_rot
        base += d_rot

        if water_availability.upper() == "LOW" and crop.get("water_demand") == "HIGH":
            base -= 15
            negatives.append("High water-demand crop while field water availability is LOW.")
        elif water_availability.upper() == "HIGH" and crop.get("water_demand") == "HIGH":
            positives.append("Water availability recorded as HIGH.")

        sd, smsg = _season_delta(crop.get("season", "BOTH"), month)
        base += sd
        if sd < 0 and smsg:
            negatives.append(smsg)
        elif sd > 0 and smsg:
            positives.append(smsg)

        if farmer_preference and farmer_preference.lower() == code:
            base += 5
            positives.append("Matches farmer preference (not agronomic proof).")

        if code in market_bonus:
            base += market_bonus[code]
            positives.append("Fresh market price signal (not profit).")

        score = max(0.0, min(100.0, base))
        warnings = list(warnings_global)
        if history_status != "KNOWN":
            warnings.append("HISTORY_UNKNOWN: rotation not applied.")
        recs.append(
            {
                "crop": code,
                "name_en": crop.get("name_en", code),
                "name_te": crop.get("name_te", ""),
                "suitability_score": round(score, 1),
                "positive_factors": positives,
                "negative_factors": negatives,
                "warnings": warnings,
                "constraints": [],
            }
        )

    recs.sort(key=lambda r: r["suitability_score"], reverse=True)
    for i, r in enumerate(recs, 1):
        r["rank"] = i
    return {
        "model_version": model_version,
        "rule_version": RULE_VERSION,
        "ml_status": _model_meta.get("status"),
        "recommendations": recs,
        "feature_sources": feature_sources,
        "disclaimer": "Suitability is a decision-support score, not guaranteed yield or profit.",
    }
