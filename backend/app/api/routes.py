from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.db import get_db
from app.engines.crop_analysis import analyze_crops, load_model, model_meta
from app.engines.irrigation import IrrigationInput, evaluate_irrigation
from app.engines.sensor_health import assess_reading
from app.providers.external import WeatherUnavailable, fetch_climate, fetch_market, fetch_open_meteo, fetch_soilgrids
from app.security import (
    assert_field_access,
    create_token,
    farmer_id_of,
    get_current_user,
    hash_password,
    verify_device_token,
    verify_password,
)

router = APIRouter()
_next_irr_n = 1
_provider_status = {"weather": "unknown", "soil": "unknown", "market": "unknown", "llm": "unknown"}


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    role: str = "farmer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class FarmIn(BaseModel):
    name: str
    latitude: float | None = None
    longitude: float | None = None
    area_m2: float | None = None
    water_source: str | None = None
    irrigation_infrastructure: str | None = None


class FieldIn(BaseModel):
    farm_id: str
    name: str
    latitude: float
    longitude: float
    area_m2: float = 0
    soil_type: str | None = None
    water_availability: str = "MODERATE"
    irrigation_method: str = "DRIP"
    geojson: dict | None = None
    previous_crop_code: str | None = None
    previous_history_status: str = "UNKNOWN"


class SoilIn(BaseModel):
    ph: float | None = None
    n: float | None = None
    p: float | None = None
    k: float | None = None
    texture: str | None = None
    is_lab_test: bool = False


class CropSetIn(BaseModel):
    crops: list[dict]


class HistoryIn(BaseModel):
    history_status: str
    crop_code: str | None = None
    season: str | None = None
    variety: str | None = None


class ReadingIn(BaseModel):
    device_id: str
    field_id: str | None = None
    timestamp: str | None = None
    soil_moisture: float | None = None
    temperature: float | None = None
    humidity: float | None = None
    battery: float | None = None
    network_status: str | None = None


class SimIn(BaseModel):
    field_id: str
    scenario: str


class ChatIn(BaseModel):
    message: str
    field_id: str | None = None
    language: str = "en"
    confirmation_id: str | None = None


def _public_code() -> str:
    global _next_irr_n
    c = f"IRR-2026-{_next_irr_n:05d}"
    _next_irr_n += 1
    return c


@router.get("/health")
def health():
    return {"ok": True, "service": "aquacrop"}


@router.post("/auth/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=body.email.lower()).first():
        raise HTTPException(400, "Email already registered")
    role = body.role if body.role in ("farmer", "engineer", "admin") else "farmer"
    user = models.User(email=body.email.lower(), password_hash=hash_password(body.password), role=role)
    db.add(user)
    db.flush()
    farmer = None
    if role == "farmer":
        farmer = models.Farmer(user_id=user.id, display_name=body.display_name)
        db.add(farmer)
        db.flush()
    db.commit()
    token = create_token(user.id, user.role, farmer.id if farmer else None)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "role": user.role}


@router.post("/auth/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user.id, user.role, farmer_id_of(user))
    return {"access_token": token, "token_type": "bearer", "role": user.role, "farmer_id": farmer_id_of(user)}


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "role": user.role, "farmer_id": farmer_id_of(user)}


@router.post("/farms")
def create_farm(body: FarmIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not user.farmer:
        raise HTTPException(403, "Only farmers create farms")
    farm = models.Farm(farmer_id=user.farmer.id, **body.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm_out(farm)


@router.get("/farms")
def list_farms(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    q = db.query(models.Farm)
    if user.role == "farmer":
        if not user.farmer:
            return []
        q = q.filter_by(farmer_id=user.farmer.id)
    return [farm_out(f) for f in q.all()]


def farm_out(f: models.Farm) -> dict:
    return {
        "id": f.id,
        "farmer_id": f.farmer_id,
        "name": f.name,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "area_m2": f.area_m2,
        "water_source": f.water_source,
        "irrigation_infrastructure": f.irrigation_infrastructure,
        "field_count": len(f.fields) if f.fields else 0,
    }


@router.get("/farms/{farm_id}")
def get_farm(farm_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    farm = db.get(models.Farm, farm_id)
    if not farm:
        raise HTTPException(404, "Farm not found")
    if user.role == "farmer" and (not user.farmer or farm.farmer_id != user.farmer.id):
        raise HTTPException(403, "Forbidden")
    return {**farm_out(farm), "fields": [field_brief(x) for x in farm.fields]}


@router.post("/fields")
def create_field(body: FieldIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    farm = db.get(models.Farm, body.farm_id)
    if not farm:
        raise HTTPException(404, "Farm not found")
    if user.role == "farmer" and (not user.farmer or farm.farmer_id != user.farmer.id):
        raise HTTPException(403, "Forbidden")
    field = models.Field(
        farm_id=farm.id,
        farmer_id=farm.farmer_id,
        name=body.name,
        latitude=body.latitude,
        longitude=body.longitude,
        area_m2=body.area_m2,
        soil_type=body.soil_type,
        water_availability=body.water_availability,
        irrigation_method=body.irrigation_method,
    )
    db.add(field)
    db.flush()
    if body.geojson:
        db.add(models.FieldBoundary(field_id=field.id, geojson=body.geojson, area_m2_calculated=body.area_m2, source="FARMER_INPUT"))
    status = body.previous_history_status
    crop = None
    if body.previous_crop_code:
        crop = db.query(models.Crop).filter_by(code=body.previous_crop_code.lower()).first()
        status = "KNOWN"
    db.add(
        models.CropHistory(
            field_id=field.id,
            crop_id=crop.id if crop else None,
            history_status=status,
            source="FARMER_INPUT",
        )
    )
    db.commit()
    db.refresh(field)
    return field_out(db, field)


@router.get("/fields")
def list_fields(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    q = db.query(models.Field)
    if user.role == "farmer" and user.farmer:
        q = q.filter_by(farmer_id=user.farmer.id)
    return [field_brief(f) for f in q.all()]


@router.get("/fields/{field_id}")
def get_field(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    return field_out(db, field)


def field_brief(f: models.Field) -> dict:
    return {"id": f.id, "farm_id": f.farm_id, "name": f.name, "latitude": f.latitude, "longitude": f.longitude, "area_m2": f.area_m2}


def field_out(db: Session, f: models.Field) -> dict:
    current = db.query(models.FieldCrop).filter_by(field_id=f.id, is_current=True).all()
    hist = db.query(models.CropHistory).filter_by(field_id=f.id).order_by(models.CropHistory.created_at.desc()).first()
    crops_map = {c.id: c for c in db.query(models.Crop).all()}
    prev = None
    if hist:
        prev = {
            "history_status": hist.history_status,
            "crop": crops_map[hist.crop_id].code if hist.crop_id else None,
            "source": hist.source,
        }
    device = db.query(models.Device).filter_by(field_id=f.id).first()
    reading = None
    if device:
        reading = db.query(models.SensorReading).filter_by(device_id=device.id).order_by(models.SensorReading.ts.desc()).first()
    return {
        "id": f.id,
        "farm_id": f.farm_id,
        "farmer_id": f.farmer_id,
        "name": f.name,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "area_m2": {"value": f.area_m2, "unit": "m2", "source": "FARMER_INPUT"},
        "soil_type": f.soil_type,
        "water_availability": f.water_availability,
        "irrigation_method": f.irrigation_method,
        "boundary": f.boundary.geojson if f.boundary else None,
        "current_crops": [
            {
                "crop": crops_map[fc.crop_id].code,
                "name_en": crops_map[fc.crop_id].name_en,
                "name_te": crops_map[fc.crop_id].name_te,
                "stage": fc.stage,
                "area_fraction": fc.area_fraction,
            }
            for fc in current
        ],
        "previous_crop": prev,
        "device": {
            "id": device.id,
            "hardware_id": device.hardware_id,
            "last_seen_at": device.last_seen_at.isoformat() if device and device.last_seen_at else None,
            "online": bool(device and device.last_seen_at and (datetime.now(timezone.utc) - _aware(device.last_seen_at)).total_seconds() < settings.sensor_offline_minutes * 60),
        } if device else None,
        "latest_sensors": _reading_out(reading) if reading else None,
    }


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _reading_out(r: models.SensorReading) -> dict:
    return {
        "ts": r.ts.isoformat(),
        "soil_moisture": {"value": r.soil_moisture, "unit": "percent", "source": r.source, "quality": r.health_status},
        "temperature": {"value": r.temperature, "unit": "C", "source": r.source},
        "humidity": {"value": r.humidity, "unit": "percent", "source": r.source},
        "health_status": r.health_status,
        "health_reasons": r.health_reasons,
        "battery": r.battery,
    }


@router.get("/crops")
def crops(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return [{"code": c.code, "name_en": c.name_en, "name_te": c.name_te, "family": c.family, "season": c.season, "water_demand": c.water_demand} for c in db.query(models.Crop).all()]


@router.post("/fields/{field_id}/crop")
def set_crop(field_id: str, body: CropSetIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    total = sum(float(x.get("area_fraction", 0)) for x in body.crops)
    if abs(total - 1.0) > 0.01:
        raise HTTPException(422, "Mixed crop fractions must sum to 100%")
    db.query(models.FieldCrop).filter_by(field_id=field.id, is_current=True).update({"is_current": False})
    group = models.uid() if len(body.crops) > 1 else None
    for item in body.crops:
        crop = db.query(models.Crop).filter_by(code=item["code"].lower()).first()
        if not crop:
            raise HTTPException(404, f"Unknown crop {item.get('code')}")
        db.add(models.FieldCrop(field_id=field.id, crop_id=crop.id, stage=item.get("stage", "VEGETATIVE"), area_fraction=item["area_fraction"], is_current=True, mixed_group_id=group, planting_date=item.get("planting_date")))
    db.commit()
    return field_out(db, field)


@router.post("/fields/{field_id}/crop-history")
def add_history(field_id: str, body: HistoryIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    crop = db.query(models.Crop).filter_by(code=body.crop_code.lower()).first() if body.crop_code else None
    row = models.CropHistory(field_id=field.id, crop_id=crop.id if crop else None, history_status=body.history_status, season=body.season, variety=body.variety, source="FARMER_INPUT")
    db.add(row)
    db.commit()
    return {"id": row.id, "history_status": row.history_status, "source": row.source}


@router.get("/fields/{field_id}/crop-history")
def get_history(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    rows = db.query(models.CropHistory).filter_by(field_id=field.id).all()
    return [
        {"id": r.id, "status": r.history_status, "crop_id": r.crop_id, "source": r.source, "season": r.season}
        for r in rows
    ]


@router.post("/fields/{field_id}/soil-observation")
def soil_obs(field_id: str, body: SoilIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    row = models.SoilObservation(field_id=field.id, **body.model_dump(), source="FARMER_INPUT")
    db.add(row)
    db.commit()
    return {"id": row.id, "source": row.source, "is_lab_test": row.is_lab_test}


@router.get("/fields/{field_id}/soil")
async def get_soil(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    obs = db.query(models.SoilObservation).filter_by(field_id=field.id).order_by(models.SoilObservation.observed_at.desc()).first()
    remote = await fetch_soilgrids(field.latitude, field.longitude)
    _provider_status["soil"] = "ok" if remote else "unavailable"
    farmer = None
    if obs:
        farmer = {
            "ph": {"value": obs.ph, "source": obs.source},
            "n": {"value": obs.n, "source": obs.source},
            "p": {"value": obs.p, "source": obs.source},
            "k": {"value": obs.k, "source": obs.source},
            "texture": {"value": obs.texture, "source": obs.source},
            "is_lab_test": obs.is_lab_test,
            "presentation": "LAB" if obs.is_lab_test else "FARMER_OBSERVATION",
        }
    return {
        "farmer_observation": farmer,
        "background_estimate": remote,
        "note": "Background SoilGrids data is ESTIMATED and is not a laboratory soil test. If the provider is unavailable, it is omitted.",
    }


@router.get("/fields/{field_id}/weather")
async def get_weather(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    try:
        data = await fetch_open_meteo(field.latitude, field.longitude)
        _provider_status["weather"] = "ok"
        db.add(models.WeatherCache(field_id=field.id, provider="open-meteo", latitude=field.latitude, longitude=field.longitude, payload=data, quality="OK"))
        db.commit()
        return data
    except WeatherUnavailable as e:
        _provider_status["weather"] = "unavailable"
        raise HTTPException(503, {"error": "WEATHER_DATA_UNAVAILABLE", "detail": str(e)})


@router.get("/fields/{field_id}/climate")
async def get_climate(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    try:
        return await fetch_climate(field.latitude, field.longitude)
    except WeatherUnavailable as e:
        raise HTTPException(503, {"error": "CLIMATE_DATA_UNAVAILABLE", "detail": str(e)})


@router.get("/fields/{field_id}/market")
async def get_market(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    assert_field_access(db, user, field_id)
    data = await fetch_market("Tomato")
    _provider_status["market"] = "ok" if data else "unavailable"
    if not data:
        return {"error": "MARKET_DATA_UNAVAILABLE", "detail": "No data.gov.in API key or empty/failed response. Market is not used for irrigation."}
    return data


@router.post("/fields/{field_id}/crop-analysis")
async def crop_analysis(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    catalog = [
        {"code": c.code, "name_en": c.name_en, "name_te": c.name_te, "season": c.season, "water_demand": c.water_demand}
        for c in db.query(models.Crop).all()
    ]
    obs = db.query(models.SoilObservation).filter_by(field_id=field.id).order_by(models.SoilObservation.observed_at.desc()).first()
    weather = None
    try:
        weather = await fetch_open_meteo(field.latitude, field.longitude)
    except WeatherUnavailable:
        weather = None
    climate = None
    try:
        climate = await fetch_climate(field.latitude, field.longitude)
    except WeatherUnavailable:
        climate = None
    hist = db.query(models.CropHistory).filter_by(field_id=field.id).order_by(models.CropHistory.created_at.desc()).first()
    prev_code = None
    status = "NO_DATA"
    if hist:
        status = hist.history_status
        if hist.crop_id:
            prev_code = db.get(models.Crop, hist.crop_id).code
    n = obs.n if obs else None
    p = obs.p if obs else None
    k = obs.k if obs else None
    ph = obs.ph if obs else None
    temp = weather["current_temperature_c"] if weather else None
    hum = weather["current_humidity_pct"] if weather else None
    rain = climate["annual_precip_mm_estimate"] if climate and climate.get("annual_precip_mm_estimate") else None
    # Dataset rainfall is typically seasonal totals in similar range to annual-ish educational sets; map annual to feature only if present, labeled.
    feature_sources = {
        "N": obs.source if obs and n is not None else None,
        "P": obs.source if obs and p is not None else None,
        "K": obs.source if obs and k is not None else None,
        "ph": obs.source if obs and ph is not None else None,
        "temperature": "WEATHER_API" if temp is not None else None,
        "humidity": "WEATHER_API" if hum is not None else None,
        "rainfall": "HISTORICAL" if rain is not None else None,
    }
    month = datetime.now().month
    result = analyze_crops(
        catalog=catalog,
        n=n, p=p, k=k, temperature=temp, humidity=hum, ph=ph, rainfall=rain,
        feature_sources=feature_sources,
        previous_code=prev_code,
        history_status=status,
        water_availability=field.water_availability,
        farmer_preference=None,
        market_bonus={},
        month=month,
    )
    analysis = models.CropAnalysis(
        field_id=field.id,
        farmer_id=field.farmer_id,
        model_version=result.get("model_version"),
        rule_version=result["rule_version"],
        inputs={"n": n, "p": p, "k": k, "temp": temp, "humidity": hum, "ph": ph, "rainfall": rain, "previous": prev_code, "history_status": status},
        sources=feature_sources,
    )
    db.add(analysis)
    db.flush()
    for rec in result["recommendations"][:15]:
        db.add(models.CropRecommendation(
            analysis_id=analysis.id,
            crop_code=rec["crop"],
            score=rec["suitability_score"],
            rank=rec["rank"],
            positives=rec["positive_factors"],
            negatives=rec["negative_factors"],
            warnings=rec["warnings"],
            constraints=rec["constraints"],
        ))
    db.add(models.DecisionTrace(decision_id=analysis.id, kind="CROP_ANALYSIS", blob=result))
    db.commit()
    return {
        "analysis_id": analysis.id,
        "field_id": field.id,
        "field_name": field.name,
        "location": {"latitude": field.latitude, "longitude": field.longitude, "source": "FARMER_INPUT"},
        "soil": {"n": n, "p": p, "k": k, "ph": ph, "source": obs.source if obs else None},
        "previous_crop": {"code": prev_code, "status": status, "source": hist.source if hist else None},
        "weather": weather,
        "climate": climate,
        "water_availability": field.water_availability,
        **result,
        "timestamp": analysis.created_at.isoformat(),
    }


@router.get("/fields/{field_id}/crop-recommendations")
def get_recs(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    a = db.query(models.CropAnalysis).filter_by(field_id=field.id).order_by(models.CropAnalysis.created_at.desc()).first()
    if not a:
        return {"recommendations": []}
    recs = db.query(models.CropRecommendation).filter_by(analysis_id=a.id).order_by(models.CropRecommendation.rank).all()
    return {
        "analysis_id": a.id,
        "model_version": a.model_version,
        "rule_version": a.rule_version,
        "recommendations": [
            {"crop": r.crop_code, "suitability_score": r.score, "rank": r.rank, "positive_factors": r.positives, "negative_factors": r.negatives, "warnings": r.warnings}
            for r in recs
        ],
    }


def _device_from_token(db: Session, token: str) -> models.Device:
    for d in db.query(models.Device).all():
        if verify_device_token(token, d.token_hash):
            return d
    raise HTTPException(401, "Invalid device token")


@router.post("/sensor/readings")
def ingest(body: ReadingIn, db: Session = Depends(get_db), x_device_token: str | None = Header(default=None)):
    if not x_device_token:
        raise HTTPException(401, "Device token required")
    device = _device_from_token(db, x_device_token)
    if body.device_id not in (device.id, device.hardware_id):
        raise HTTPException(403, "device_id does not match token")
    ts = datetime.now(timezone.utc)
    if body.timestamp:
        try:
            ts = datetime.fromisoformat(body.timestamp.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(422, "Invalid timestamp")
    prev = db.query(models.SensorReading).filter_by(device_id=device.id).order_by(models.SensorReading.ts.desc()).first()
    status, reasons = assess_reading(
        soil_moisture=body.soil_moisture,
        temperature=body.temperature,
        humidity=body.humidity,
        ts=ts,
        last_seen=device.last_seen_at,
        prev_moisture=prev.soil_moisture if prev else None,
        offline_minutes=settings.sensor_offline_minutes,
    )
    device.last_seen_at = datetime.now(timezone.utc)
    row = models.SensorReading(
        device_id=device.id,
        field_id=device.field_id,
        ts=ts,
        soil_moisture=body.soil_moisture,
        temperature=body.temperature,
        humidity=body.humidity,
        battery=body.battery,
        source="REAL_SENSOR",
        health_status=status,
        health_reasons=reasons,
    )
    db.add(row)
    if status in ("OFFLINE", "INVALID", "WARNING"):
        _emit_alert(db, device.field_id, "SENSOR_STALE" if status == "WARNING" else "ABNORMAL_SENSOR_READING", "WARNING", f"Sensor health {status}: {reasons}", "REAL_SENSOR")
    db.commit()
    return {"id": row.id, "health_status": status, "health_reasons": reasons, "source": "REAL_SENSOR"}


@router.get("/fields/{field_id}/sensors")
def field_sensors(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    rows = db.query(models.SensorReading).filter_by(field_id=field.id).order_by(models.SensorReading.ts.desc()).limit(50).all()
    return [_reading_out(r) for r in rows]


@router.get("/devices/{device_id}/status")
def device_status(device_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    device = db.get(models.Device, device_id) or db.query(models.Device).filter_by(hardware_id=device_id).first()
    if not device:
        raise HTTPException(404, "Device not found")
    assert_field_access(db, user, device.field_id)
    last = device.last_seen_at
    online = bool(last and (datetime.now(timezone.utc) - _aware(last)).total_seconds() < settings.sensor_offline_minutes * 60)
    return {"id": device.id, "hardware_id": device.hardware_id, "last_seen_at": last.isoformat() if last else None, "online": online, "actuator_ok": device.actuator_ok}


@router.get("/devices/{device_id}/commands")
def poll_commands(device_id: str, db: Session = Depends(get_db), x_device_token: str | None = Header(default=None)):
    if not x_device_token:
        raise HTTPException(401, "Device token required")
    device = _device_from_token(db, x_device_token)
    if device_id not in (device.id, device.hardware_id):
        raise HTTPException(403, "Mismatch")
    now = datetime.now(timezone.utc)
    q = db.query(models.Command).filter(models.Command.device_id == device.id, models.Command.exec_status == "PENDING")
    out = []
    for cmd in q.all():
        if _aware(cmd.expires_at) < now:
            cmd.exec_status = "EXPIRED"
            continue
        cmd.exec_status = "SENT"
        out.append({"command_id": cmd.id, "decision_id": cmd.decision_id, "payload": cmd.payload, "expires_at": cmd.expires_at.isoformat()})
    db.commit()
    return {"commands": out}


@router.post("/devices/{device_id}/commands/{command_id}/ack")
def ack_command(device_id: str, command_id: str, db: Session = Depends(get_db), x_device_token: str | None = Header(default=None)):
    device = _device_from_token(db, x_device_token or "")
    cmd = db.get(models.Command, command_id)
    if not cmd or cmd.device_id != device.id:
        raise HTTPException(404, "Command not found")
    cmd.exec_status = "EXECUTED"
    cmd.acked_at = datetime.now(timezone.utc)
    ex = db.query(models.IrrigationExecution).filter_by(command_id=cmd.id).first()
    if ex:
        ex.status = "COMPLETED"
        ex.ended_at = cmd.acked_at
    db.commit()
    return {"ok": True}


def _latest_reading(db: Session, field_id: str) -> models.SensorReading | None:
    return db.query(models.SensorReading).filter_by(field_id=field_id).order_by(models.SensorReading.ts.desc()).first()


def _hours_since_irrigation(db: Session, field_id: str) -> float | None:
    ex = (
        db.query(models.IrrigationExecution)
        .join(models.IrrigationDecision, models.IrrigationExecution.decision_id == models.IrrigationDecision.id)
        .filter(models.IrrigationDecision.field_id == field_id, models.IrrigationExecution.mode == "REAL", models.IrrigationExecution.status.in_(["STARTED", "COMPLETED"]))
        .order_by(models.IrrigationExecution.started_at.desc())
        .first()
    )
    if not ex:
        return None
    return (datetime.now(timezone.utc) - _aware(ex.started_at)).total_seconds() / 3600


async def _eval_field(db: Session, field: models.Field, scenario: str | None) -> models.IrrigationDecision:
    reading = _latest_reading(db, field.id)
    weather = None
    try:
        weather = await fetch_open_meteo(field.latitude, field.longitude)
        _provider_status["weather"] = "ok"
    except WeatherUnavailable:
        _provider_status["weather"] = "unavailable"
        weather = None
    device = db.query(models.Device).filter_by(field_id=field.id).first()
    fc = db.query(models.FieldCrop).filter_by(field_id=field.id, is_current=True).first()
    crop = db.get(models.Crop, fc.crop_id) if fc else None
    low, high, stage, code = 30.0, 55.0, "VEGETATIVE", None
    if crop:
        low, high, code = crop.low_moisture_pct, crop.high_moisture_pct, crop.code
        stage = fc.stage
    health = reading.health_status if reading else "OFFLINE"
    reasons = reading.health_reasons if reading else ["MISSING"]
    if device and device.last_seen_at:
        unseen = (datetime.now(timezone.utc) - _aware(device.last_seen_at)).total_seconds() / 60
        if unseen > settings.sensor_offline_minutes:
            health = "OFFLINE"
            reasons = list(reasons) + ["DISCONNECTED"]
    inp = IrrigationInput(
        moisture_pct=reading.soil_moisture if reading else None,
        moisture_source=reading.source if reading else "UNAVAILABLE",
        moisture_health=health,
        health_reasons=list(reasons or []),
        temperature_c=reading.temperature if reading else (weather or {}).get("current_temperature_c"),
        humidity_pct=reading.humidity if reading else None,
        rain_prob_24h=(weather or {}).get("rain_probability_24h"),
        precip_mm_24h=(weather or {}).get("precip_mm_24h"),
        weather_available=weather is not None,
        crop_code=code,
        stage=stage,
        low_threshold=low,
        high_threshold=high,
        area_m2=field.area_m2,
        irrigation_method=field.irrigation_method,
        water_availability=field.water_availability,
        hours_since_irrigation=_hours_since_irrigation(db, field.id),
        et0_mm=(weather or {}).get("et0_mm"),
        flow_lpm=device.pump_flow_lpm if device else None,
        max_actuator_seconds=settings.max_actuator_seconds,
        simulation_scenario=scenario,
    )
    result = evaluate_irrigation(inp)
    dec = models.IrrigationDecision(
        public_code=_public_code(),
        field_id=field.id,
        farmer_id=field.farmer_id,
        farm_id=field.farm_id,
        crop_code=code,
        action=result.action,
        litres_estimated=result.litres_estimated,
        duration_seconds=result.duration_seconds,
        reason_codes=result.reason_codes,
        confidence=result.confidence,
        data_quality=result.data_quality,
        freshness=result.freshness,
        mode=result.mode,
        inputs=result.inputs_snapshot,
        sources=result.sources,
        explanation=result.explanation,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.decision_ttl_minutes),
    )
    db.add(dec)
    db.flush()
    db.add(models.DecisionTrace(decision_id=dec.id, kind="IRRIGATION", blob={"public_code": dec.public_code, **result.explanation, "reasons": result.reason_codes}))
    if result.action == "IRRIGATE" and result.mode == "REAL":
        _emit_alert(db, field.id, "IRRIGATION_RECOMMENDED", "WARNING", "Irrigation recommended by engine", "ENGINE_DECISION")
    if result.action == "DELAY":
        _emit_alert(db, field.id, "IRRIGATION_DELAYED", "INFO", "Irrigation delayed by engine", "ENGINE_DECISION")
    db.commit()
    db.refresh(dec)
    return dec


def _emit_alert(db: Session, field_id: str, typ: str, sev: str, msg: str, source: str):
    field = db.get(models.Field, field_id)
    if not field:
        return
    key = f"{field_id}:{typ}"
    recent = db.query(models.Alert).filter_by(debounce_key=key).order_by(models.Alert.ts.desc()).first()
    if recent and (datetime.now(timezone.utc) - _aware(recent.ts)).total_seconds() < 7200:
        return
    db.add(models.Alert(farmer_id=field.farmer_id, farm_id=field.farm_id, field_id=field_id, type=typ, severity=sev, message=msg, source=source, debounce_key=key))


def decision_out(d: models.IrrigationDecision) -> dict:
    return {
        "decision_id": d.id,
        "public_code": d.public_code,
        "field_id": d.field_id,
        "action": d.action,
        "estimated_water_litres": {"value": d.litres_estimated, "source": "ESTIMATED"} if d.litres_estimated is not None else None,
        "estimated_duration_seconds": d.duration_seconds,
        "reason_codes": d.reason_codes,
        "confidence": d.confidence,
        "data_quality": d.data_quality,
        "data_freshness": d.freshness,
        "rule_version": d.rule_version,
        "mode": d.mode,
        "sources": d.sources,
        "explanation": d.explanation,
        "crop": d.crop_code,
        "created_at": d.created_at.isoformat(),
        "expires_at": d.expires_at.isoformat(),
        "confirmed": bool(d.confirmed_at),
        "execute_blocked": d.explanation.get("execute_blocked") if isinstance(d.explanation, dict) else False,
    }


@router.post("/fields/{field_id}/irrigation/evaluate")
async def irrig_eval(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    d = await _eval_field(db, field, None)
    return decision_out(d)


@router.get("/fields/{field_id}/irrigation/history")
def irrig_hist(field_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, field_id)
    decs = db.query(models.IrrigationDecision).filter_by(field_id=field.id).order_by(models.IrrigationDecision.created_at.desc()).limit(40).all()
    exs = db.query(models.IrrigationExecution).all()
    ex_by = {e.decision_id: e for e in exs}
    return [
        {
            **decision_out(d),
            "execution": {
                "status": ex_by[d.id].status,
                "started_at": ex_by[d.id].started_at.isoformat(),
                "litres_estimated": {"value": ex_by[d.id].litres_estimated, "source": "ESTIMATED"},
                "litres_actual": {"value": ex_by[d.id].litres_actual, "source": ex_by[d.id].litres_actual_source} if ex_by[d.id].litres_actual is not None else None,
                "mode": ex_by[d.id].mode,
            } if d.id in ex_by else None,
        }
        for d in decs
    ]


@router.post("/irrigation/{decision_id}/confirm")
def confirm(decision_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    d = db.get(models.IrrigationDecision, decision_id)
    if not d:
        raise HTTPException(404, "Decision not found")
    assert_field_access(db, user, d.field_id)
    if _aware(d.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(409, "Decision expired")
    d.confirmed_at = datetime.now(timezone.utc)
    d.confirmed_by = user.id
    db.add(models.AuditLog(actor=user.id, action="CONFIRM_IRRIGATION", entity="decision", entity_id=d.id, meta={"public_code": d.public_code}))
    db.commit()
    return {"ok": True, "decision_id": d.id, "public_code": d.public_code}


@router.post("/irrigation/{decision_id}/execute")
def execute(decision_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user), idempotency_key: str | None = Header(default=None, alias="Idempotency-Key")):
    d = db.get(models.IrrigationDecision, decision_id)
    if not d:
        raise HTTPException(404, "Decision not found")
    field = assert_field_access(db, user, d.field_id)
    if d.mode == "SIMULATION":
        raise HTTPException(403, "Simulation decisions cannot actuate hardware")
    if not d.confirmed_at:
        raise HTTPException(403, "Farmer confirmation required")
    if _aware(d.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(409, "Decision expired")
    if d.explanation.get("execute_blocked"):
        raise HTTPException(409, "Safety blocked: sensor unreliable or other execute_blocked flag")
    if d.action != "IRRIGATE":
        raise HTTPException(409, "Decision action is not IRRIGATE")
    device = db.query(models.Device).filter_by(field_id=field.id).first()
    if not device:
        raise HTTPException(409, "No device bound to field")
    if not device.last_seen_at or (datetime.now(timezone.utc) - _aware(device.last_seen_at)).total_seconds() > settings.sensor_offline_minutes * 60:
        raise HTTPException(409, "DEVICE_OFFLINE")
    if not device.actuator_ok:
        raise HTTPException(409, "ACTUATOR_FAILURE")
    key = idempotency_key or f"{d.id}:execute"
    existing = db.query(models.Command).filter_by(idempotency_key=key).first()
    if existing:
        return {"command_id": existing.id, "status": existing.exec_status, "duplicate": True}
    dur = min(d.duration_seconds or 8, settings.max_actuator_seconds)
    cmd = models.Command(
        farmer_id=field.farmer_id,
        farm_id=field.farm_id,
        field_id=field.id,
        device_id=device.id,
        decision_id=d.id,
        idempotency_key=key,
        requested_by=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        payload={"channel": "ACTUATOR_1", "duration_ms": int(dur * 1000), "public_code": d.public_code},
    )
    db.add(cmd)
    db.flush()
    db.add(models.IrrigationExecution(decision_id=d.id, command_id=cmd.id, litres_estimated=d.litres_estimated, status="STARTED", trigger="CONFIRMED", mode="REAL"))
    db.add(models.AuditLog(actor=user.id, action="EXECUTE_IRRIGATION", entity="command", entity_id=cmd.id, meta={"decision": d.public_code}))
    db.commit()
    return {"command_id": cmd.id, "status": "PENDING", "payload": cmd.payload}


@router.post("/simulation/scenario")
async def simulate(body: SimIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = assert_field_access(db, user, body.field_id)
    d = await _eval_field(db, field, body.scenario)
    run = models.SimulationRun(field_id=field.id, scenario=body.scenario, overlay={"scenario": body.scenario}, decision_id=d.id)
    db.add(run)
    db.commit()
    return {"simulation": True, "scenario": body.scenario, "mode": "SIMULATION", "decision": decision_out(d), "run_id": run.id}


@router.get("/alerts")
def alerts(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    q = db.query(models.Alert).order_by(models.Alert.ts.desc()).limit(50)
    if user.role == "farmer" and user.farmer:
        q = q.filter_by(farmer_id=user.farmer.id)
    return [
        {"id": a.id, "type": a.type, "severity": a.severity, "message": a.message, "source": a.source, "ts": a.ts.isoformat(), "acknowledged": a.acknowledged, "field_id": a.field_id}
        for a in q.all()
    ]


@router.post("/alerts/{alert_id}/acknowledge")
def ack_alert(alert_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    a = db.get(models.Alert, alert_id)
    if not a:
        raise HTTPException(404)
    if user.role == "farmer" and (not user.farmer or a.farmer_id != user.farmer.id):
        raise HTTPException(403)
    a.acknowledged = True
    db.commit()
    return {"ok": True}


@router.get("/irrigation/{decision_id}/trace")
def trace(decision_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    d = db.get(models.IrrigationDecision, decision_id)
    if not d:
        raise HTTPException(404)
    assert_field_access(db, user, d.field_id)
    t = db.query(models.DecisionTrace).filter_by(decision_id=d.id).first()
    return {"decision": decision_out(d), "trace": t.blob if t else None}


@router.get("/engineer/status")
def engineer_status(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if user.role not in ("engineer", "admin"):
        raise HTTPException(403, "Engineer role required")
    devices = db.query(models.Device).all()
    return {
        "providers": _provider_status,
        "model": model_meta(),
        "devices": [
            {"id": d.id, "hardware_id": d.hardware_id, "field_id": d.field_id, "last_seen_at": d.last_seen_at.isoformat() if d.last_seen_at else None}
            for d in devices
        ],
        "pending_commands": db.query(models.Command).filter_by(exec_status="PENDING").count(),
        "rule_versions": {"irrigation": "irrigation-engine-v1", "crop": "crop-analysis-rules-v1"},
    }


# --- AI agent (keyword tools; LLM optional) ---

def _search_knowledge(db: Session, q: str) -> list[str]:
    qn = q.lower()
    hits = []
    for doc in db.query(models.KnowledgeDocument).all():
        blob = (doc.title + " " + doc.body + " " + doc.tags).lower()
        if any(w in blob for w in qn.split() if len(w) > 3) or any(t in qn for t in doc.tags.split()):
            hits.append(f"{doc.title}: {doc.body}")
    return hits[:3]


@router.post("/ai/chat")
async def chat(body: ChatIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    field = None
    if body.field_id:
        field = assert_field_access(db, user, body.field_id)
    elif user.farmer:
        field = db.query(models.Field).filter_by(farmer_id=user.farmer.id).first()
    if not field:
        return {"reply": "Please select a field first.", "categories": ["AI_EXPLANATION"]}

    msg = body.message
    low = msg.lower()
    tool_notes = []
    categories = []
    facts = []

    want_irrig = any(k in low for k in ["irrigat", "నీళ్లు", "నీరు", "water field", "pump", "పెట్టాలా"])
    want_rain = any(k in low for k in ["rain", "వర్షం", "weather"])
    want_crop = any(k in low for k in ["crop", "పంట", "suitable", "recommend"])
    want_exec = body.confirmation_id or low.strip() in ("yes", "y", "ok", "అవును", "start")

    if want_rain or want_irrig:
        try:
            w = await fetch_open_meteo(field.latitude, field.longitude)
            facts.append(f"Weather API: rain probability next 24h is {w.get('rain_probability_24h')}% [WEATHER_API]. Temperature {w.get('current_temperature_c')}°C.")
            categories.append("WEATHER_FACT")
            tool_notes.append("get_weather")
        except WeatherUnavailable:
            facts.append("Weather data is unavailable. Recommendation will not invent rain.")
            categories.append("WEATHER_FACT")

    reading = _latest_reading(db, field.id)
    if reading:
        facts.append(f"Sensor soil moisture {reading.soil_moisture}% [{reading.source}] health={reading.health_status}.")
        categories.append("SENSOR_FACT")
        tool_notes.append("get_sensor_data")

    decision = None
    if want_irrig:
        decision = await _eval_field(db, field, None)
        facts.append(f"Engine decision {decision.public_code}: {decision.action} reasons={decision.reason_codes} [ENGINE_DECISION]. Estimated water {decision.litres_estimated} L [ESTIMATED].")
        categories.append("ENGINE_DECISION")
        tool_notes.append("get_irrigation_recommendation")
        if decision.action == "IRRIGATE" and not decision.explanation.get("execute_blocked"):
            facts.append("Physical irrigation requires an on-screen confirmation. The assistant cannot start the pump from this message alone.")

    if want_crop:
        # reuse last analysis or run
        recs = db.query(models.CropAnalysis).filter_by(field_id=field.id).order_by(models.CropAnalysis.created_at.desc()).first()
        if recs:
            top = db.query(models.CropRecommendation).filter_by(analysis_id=recs.id).order_by(models.CropRecommendation.rank).limit(3).all()
            facts.append("Crop analysis (stored): " + ", ".join(f"{t.crop_code} {t.score}" for t in top) + " [CROP_ANALYSIS]")
        else:
            facts.append("No crop analysis yet. Use ANALYZE CROP in the app.")
        categories.append("CROP_ANALYSIS")

    knowledge = _search_knowledge(db, msg)
    if knowledge:
        facts.append("Knowledge: " + " | ".join(knowledge))
        categories.append("AGRICULTURAL_KNOWLEDGE")

    if want_exec and body.confirmation_id:
        facts.append("Use the Confirm button in the app. execute_authorized_irrigation is not invoked from free-text yes without the HTTP confirm endpoint.")
        categories.append("AI_EXPLANATION")

    reply_en = "Field {name}.\n{facts}\nThis text explains engine and sensor facts. It is not authorization.".format(
        name=field.name, facts="\n".join(facts) or "No tools matched; ask about irrigation, rain, or crops."
    )
    reply_te = "పొలం {name}.\n{facts}\nఇది వివరణ మాత్రమే. పంప్ ఆన్ కావాలంటే యాప్‌లో Confirm నొక్కండి.".format(
        name=field.name, facts="\n".join(facts)
    )
    reply = reply_te if body.language.startswith("te") or any("\u0c00" <= ch <= "\u0c7f" for ch in msg) else reply_en

    conv = models.AiConversation(farmer_id=field.farmer_id, messages=[{"user": msg, "assistant": reply}], lang=body.language)
    db.add(conv)
    db.flush()
    for t in tool_notes:
        db.add(models.AiToolCall(conversation_id=conv.id, tool=t, args={"field_id": field.id}, result_summary=t))
    db.commit()

    pending = decision_out(decision) if decision else None
    return {
        "reply": reply,
        "categories": categories or ["AI_EXPLANATION"],
        "field_id": field.id,
        "decision": pending,
        "llm": "template" if not settings.groq_api_key else "groq_optional_unused_template_fallback",
        "disclaimer": "Numbers come from tools/engines, not free-form model invention.",
    }


@router.post("/ai/voice")
async def voice(body: ChatIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Transcript already produced by browser STT (or future Whisper). Same path as chat."""
    return await chat(body, db, user)
