from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.security import hash_device_token, hash_password

CROPS = [
    {"code": "rice", "name_en": "Rice", "name_te": "వరి", "family": "poaceae", "season": "KHARIF", "water_demand": "HIGH", "irrigation_class": "FLOOD", "low_moisture_pct": 40, "high_moisture_pct": 70},
    {"code": "maize", "name_en": "Maize", "name_te": "మొక్కజొన్న", "family": "poaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "FURROW", "low_moisture_pct": 30, "high_moisture_pct": 55},
    {"code": "chickpea", "name_en": "Chickpea", "name_te": "శనగలు", "family": "fabaceae", "season": "RABI", "water_demand": "LOW", "irrigation_class": "FURROW", "low_moisture_pct": 25, "high_moisture_pct": 50},
    {"code": "kidneybeans", "name_en": "Kidney beans", "name_te": "రాజ్మా", "family": "fabaceae", "season": "RABI", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 28, "high_moisture_pct": 52},
    {"code": "pigeonpeas", "name_en": "Pigeon peas", "name_te": "కందులు", "family": "fabaceae", "season": "KHARIF", "water_demand": "LOW", "irrigation_class": "FURROW", "low_moisture_pct": 25, "high_moisture_pct": 50},
    {"code": "mothbeans", "name_en": "Moth beans", "name_te": "మొత్", "family": "fabaceae", "season": "KHARIF", "water_demand": "LOW", "irrigation_class": "FURROW", "low_moisture_pct": 22, "high_moisture_pct": 48},
    {"code": "mungbean", "name_en": "Green gram", "name_te": "పెసర", "family": "fabaceae", "season": "BOTH", "water_demand": "LOW", "irrigation_class": "FURROW", "low_moisture_pct": 25, "high_moisture_pct": 50},
    {"code": "blackgram", "name_en": "Black gram", "name_te": "మినుములు", "family": "fabaceae", "season": "BOTH", "water_demand": "LOW", "irrigation_class": "FURROW", "low_moisture_pct": 25, "high_moisture_pct": 50},
    {"code": "lentil", "name_en": "Lentil", "name_te": "మసూర్", "family": "fabaceae", "season": "RABI", "water_demand": "LOW", "irrigation_class": "FURROW", "low_moisture_pct": 24, "high_moisture_pct": 48},
    {"code": "pomegranate", "name_en": "Pomegranate", "name_te": "దానిమ్మ", "family": "lythraceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 28, "high_moisture_pct": 50},
    {"code": "banana", "name_en": "Banana", "name_te": "అరటి", "family": "musaceae", "season": "BOTH", "water_demand": "HIGH", "irrigation_class": "DRIP", "low_moisture_pct": 35, "high_moisture_pct": 60},
    {"code": "mango", "name_en": "Mango", "name_te": "మామిడి", "family": "anacardiaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 28, "high_moisture_pct": 50},
    {"code": "grapes", "name_en": "Grapes", "name_te": "ద్రాక్ష", "family": "vitaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 30, "high_moisture_pct": 52},
    {"code": "watermelon", "name_en": "Watermelon", "name_te": "పుచ్చకాయ", "family": "cucurbitaceae", "season": "KHARIF", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 28, "high_moisture_pct": 50},
    {"code": "muskmelon", "name_en": "Muskmelon", "name_te": "ఖర్బూజా", "family": "cucurbitaceae", "season": "KHARIF", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 28, "high_moisture_pct": 50},
    {"code": "apple", "name_en": "Apple", "name_te": "ఆపిల్", "family": "rosaceae", "season": "RABI", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 30, "high_moisture_pct": 55},
    {"code": "orange", "name_en": "Orange", "name_te": "నారింజ", "family": "rutaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 30, "high_moisture_pct": 52},
    {"code": "papaya", "name_en": "Papaya", "name_te": "బొప్పాయి", "family": "caricaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 32, "high_moisture_pct": 55},
    {"code": "coconut", "name_en": "Coconut", "name_te": "కొబ్బరి", "family": "arecaceae", "season": "BOTH", "water_demand": "HIGH", "irrigation_class": "BASIN", "low_moisture_pct": 35, "high_moisture_pct": 60},
    {"code": "cotton", "name_en": "Cotton", "name_te": "పత్తి", "family": "malvaceae", "season": "KHARIF", "water_demand": "MEDIUM", "irrigation_class": "FURROW", "low_moisture_pct": 28, "high_moisture_pct": 50},
    {"code": "jute", "name_en": "Jute", "name_te": "జనపనార", "family": "malvaceae", "season": "KHARIF", "water_demand": "HIGH", "irrigation_class": "FLOOD", "low_moisture_pct": 38, "high_moisture_pct": 65},
    {"code": "coffee", "name_en": "Coffee", "name_te": "కాఫీ", "family": "rubiaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 32, "high_moisture_pct": 55},
    {"code": "tomato", "name_en": "Tomato", "name_te": "టమాటా", "family": "solanaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 32, "high_moisture_pct": 55},
    {"code": "chilli", "name_en": "Chilli", "name_te": "మిరప", "family": "solanaceae", "season": "BOTH", "water_demand": "MEDIUM", "irrigation_class": "DRIP", "low_moisture_pct": 30, "high_moisture_pct": 52},
    {"code": "groundnut", "name_en": "Groundnut", "name_te": "వేరుశనగ", "family": "fabaceae", "season": "KHARIF", "water_demand": "MEDIUM", "irrigation_class": "FURROW", "low_moisture_pct": 28, "high_moisture_pct": 50},
]

KNOWLEDGE = [
    ("Tomato irrigation", "Tomato in flowering is sensitive to water stress and to waterlogging. AquaCrop still uses the irrigation engine, not this note, for yes/no decisions.", "tomato irrigation"),
    ("Chilli notes", "Chilli and tomato share Solanaceae family. Rotation is a factor, not a ban.", "chilli tomato rotation"),
    ("Groundnut rotation", "Groundnut is a legume. Previous groundnut may be a mild nitrogen-related positive for the next crop; this is a rule of thumb, not a soil test.", "groundnut rotation"),
    ("Rain delay", "If soil moisture is not critical and rain probability is high, delaying irrigation can reduce wasted pumping. Forecasts can be wrong.", "rain irrigation"),
    ("Safety", "AquaCrop never lets the assistant switch a pump without farmer confirmation and safety checks.", "safety irrigation"),
]


def seed_if_empty(db: Session) -> None:
    if db.query(models.Crop).count() == 0:
        for c in CROPS:
            db.add(models.Crop(**c, typical_duration_days=90, stage_depth_mm={"FLOWERING": 6}))
        db.commit()
    if db.query(models.KnowledgeDocument).count() == 0:
        for t, b, tags in KNOWLEDGE:
            db.add(models.KnowledgeDocument(title=t, body=b, tags=tags))
        db.commit()
    if not settings.hackathon_demo:
        return
    if db.query(models.User).filter_by(email="demo@aquacrop.local").first():
        return

    demo_token = "esp32-demo-token"
    farmer_user = models.User(email="demo@aquacrop.local", phone_number="+919876543210", password_hash=hash_password(settings.demo_password), role="farmer")
    eng = models.User(email="engineer@aquacrop.local", phone_number="+919999999999", password_hash=hash_password(settings.demo_password), role="engineer")
    db.add_all([farmer_user, eng])
    db.flush()
    farmer = models.Farmer(user_id=farmer_user.id, display_name="Demo Farmer", language_pref="te")
    db.add(farmer)
    db.flush()
    farm = models.Farm(
        farmer_id=farmer.id,
        name="Swarnandhra Demo Farm",
        latitude=16.434,
        longitude=81.698,
        area_m2=4000,
        water_source="borewell",
        irrigation_infrastructure="drip + demo pump/LED",
    )
    db.add(farm)
    db.flush()
    field = models.Field(
        farm_id=farm.id,
        farmer_id=farmer.id,
        name="Tomato Field 1",
        latitude=16.4342,
        longitude=81.6981,
        area_m2=1897.47,
        soil_type="sandy loam",
        water_availability="MODERATE",
        irrigation_method="DRIP",
    )
    db.add(field)
    db.flush()
    db.add(
        models.FieldBoundary(
            field_id=field.id,
            geojson={
                "type": "Polygon",
                "coordinates": [[
                    [81.6979, 16.4340],
                    [81.6983, 16.4340],
                    [81.6983, 16.4344],
                    [81.6979, 16.4344],
                    [81.6979, 16.4340],
                ]],
            },
            area_m2_calculated=1897.47,
            source="FARMER_INPUT",
        )
    )
    tomato = db.query(models.Crop).filter_by(code="tomato").one()
    groundnut = db.query(models.Crop).filter_by(code="groundnut").one()
    db.add(models.FieldCrop(field_id=field.id, crop_id=tomato.id, stage="FLOWERING", planting_date="2026-07-01", area_fraction=1.0, is_current=True))
    db.add(
        models.CropHistory(
            field_id=field.id,
            crop_id=groundnut.id,
            season="rabi",
            history_status="KNOWN",
            source="FARMER_INPUT",
            yield_if_known=None,
        )
    )
    db.add(
        models.SoilObservation(
            field_id=field.id,
            ph=6.6,
            n=40,
            p=50,
            k=45,
            texture="sandy loam",
            is_lab_test=False,
            source="FARMER_INPUT",
        )
    )
    db.add(
        models.Device(
            field_id=field.id,
            hardware_id="esp32-demo-01",
            token_hash=hash_device_token(demo_token),
            actuator_ok=True,
            pump_flow_lpm=None,
        )
    )
    db.commit()
