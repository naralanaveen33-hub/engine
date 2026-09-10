import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def uid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def normalize_phone_number(phone: str) -> str:
    cleaned = "".join(ch for ch in phone if ch.isdigit() or ch == "+")
    if not cleaned.startswith("+"):
        if cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = "+" + cleaned
        elif len(cleaned) == 10:
            cleaned = "+91" + cleaned
    return cleaned


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    email: Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String, default="")
    role: Mapped[str] = mapped_column(String, default="farmer")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    farmer: Mapped["Farmer | None"] = relationship(back_populates="user")


class OtpChallenge(Base):
    __tablename__ = "otp_challenges"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    phone_number: Mapped[str] = mapped_column(String, index=True)
    otp_code: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=5)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING")


class Farmer(Base):
    __tablename__ = "farmers"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True)
    display_name: Mapped[str] = mapped_column(String)
    language_pref: Mapped[str] = mapped_column(String, default="te")
    user: Mapped[User] = relationship(back_populates="farmer")
    farms: Mapped[list["Farm"]] = relationship(back_populates="farmer")


class Farm(Base):
    __tablename__ = "farms"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    farmer_id: Mapped[str] = mapped_column(ForeignKey("farmers.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_m2: Mapped[float | None] = mapped_column(Float, nullable=True)
    water_source: Mapped[str | None] = mapped_column(String, nullable=True)
    irrigation_infrastructure: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    farmer: Mapped[Farmer] = relationship(back_populates="farms")
    fields: Mapped[list["Field"]] = relationship(back_populates="farm")


class Field(Base):
    __tablename__ = "fields"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    farm_id: Mapped[str] = mapped_column(ForeignKey("farms.id"), index=True)
    farmer_id: Mapped[str] = mapped_column(ForeignKey("farmers.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    area_m2: Mapped[float] = mapped_column(Float, default=0)
    soil_type: Mapped[str | None] = mapped_column(String, nullable=True)
    water_availability: Mapped[str] = mapped_column(String, default="MODERATE")
    irrigation_method: Mapped[str] = mapped_column(String, default="DRIP")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    farm: Mapped[Farm] = relationship(back_populates="fields")
    boundary: Mapped["FieldBoundary | None"] = relationship(back_populates="field")


class FieldBoundary(Base):
    __tablename__ = "field_boundaries"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), unique=True)
    geojson: Mapped[dict] = mapped_column(JSON)
    area_m2_calculated: Mapped[float] = mapped_column(Float, default=0)
    source: Mapped[str] = mapped_column(String, default="FARMER_INPUT")
    field: Mapped[Field] = relationship(back_populates="boundary")


class Crop(Base):
    __tablename__ = "crops"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    code: Mapped[str] = mapped_column(String, unique=True)
    name_en: Mapped[str] = mapped_column(String)
    name_te: Mapped[str] = mapped_column(String, default="")
    family: Mapped[str] = mapped_column(String, default="UNKNOWN")
    typical_duration_days: Mapped[int] = mapped_column(Integer, default=90)
    irrigation_class: Mapped[str] = mapped_column(String, default="DRIP")
    season: Mapped[str] = mapped_column(String, default="BOTH")
    water_demand: Mapped[str] = mapped_column(String, default="MEDIUM")
    low_moisture_pct: Mapped[float] = mapped_column(Float, default=30)
    high_moisture_pct: Mapped[float] = mapped_column(Float, default=55)
    stage_depth_mm: Mapped[dict] = mapped_column(JSON, default=dict)


class FieldCrop(Base):
    __tablename__ = "field_crops"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    crop_id: Mapped[str] = mapped_column(ForeignKey("crops.id"))
    stage: Mapped[str] = mapped_column(String, default="VEGETATIVE")
    planting_date: Mapped[str | None] = mapped_column(String, nullable=True)
    area_fraction: Mapped[float] = mapped_column(Float, default=1.0)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
    mixed_group_id: Mapped[str | None] = mapped_column(String, nullable=True)


class CropHistory(Base):
    __tablename__ = "crop_history"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    crop_id: Mapped[str | None] = mapped_column(ForeignKey("crops.id"), nullable=True)
    variety: Mapped[str | None] = mapped_column(String, nullable=True)
    season: Mapped[str | None] = mapped_column(String, nullable=True)
    planting_date: Mapped[str | None] = mapped_column(String, nullable=True)
    harvest_date: Mapped[str | None] = mapped_column(String, nullable=True)
    area_m2: Mapped[float | None] = mapped_column(Float, nullable=True)
    yield_if_known: Mapped[str | None] = mapped_column(String, nullable=True)
    fertilizer_if_known: Mapped[str | None] = mapped_column(String, nullable=True)
    disease_if_known: Mapped[str | None] = mapped_column(String, nullable=True)
    pest_if_known: Mapped[str | None] = mapped_column(String, nullable=True)
    irrigation_if_known: Mapped[str | None] = mapped_column(String, nullable=True)
    history_status: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String, default="FARMER_INPUT")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class SoilObservation(Base):
    __tablename__ = "soil_observations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    ph: Mapped[float | None] = mapped_column(Float, nullable=True)
    n: Mapped[float | None] = mapped_column(Float, nullable=True)
    p: Mapped[float | None] = mapped_column(Float, nullable=True)
    k: Mapped[float | None] = mapped_column(Float, nullable=True)
    texture: Mapped[str | None] = mapped_column(String, nullable=True)
    is_lab_test: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String, default="FARMER_INPUT")
    extra: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class WeatherCache(Base):
    __tablename__ = "weather_forecasts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    provider: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    payload: Mapped[dict] = mapped_column(JSON)
    quality: Mapped[str] = mapped_column(String, default="OK")


class Device(Base):
    __tablename__ = "devices"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    hardware_id: Mapped[str] = mapped_column(String, unique=True)
    type: Mapped[str] = mapped_column(String, default="ESP32")
    token_hash: Mapped[str] = mapped_column(String)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    actuator_ok: Mapped[bool] = mapped_column(Boolean, default=True)
    pump_flow_lpm: Mapped[float | None] = mapped_column(Float, nullable=True)


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    device_id: Mapped[str] = mapped_column(ForeignKey("devices.id"), index=True)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    soil_moisture: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)
    battery: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String, default="REAL_SENSOR")
    health_status: Mapped[str] = mapped_column(String, default="HEALTHY")
    health_reasons: Mapped[list] = mapped_column(JSON, default=list)


class CropAnalysis(Base):
    __tablename__ = "crop_analyses"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    farmer_id: Mapped[str] = mapped_column(ForeignKey("farmers.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    model_version: Mapped[str | None] = mapped_column(String, nullable=True)
    rule_version: Mapped[str] = mapped_column(String, default="crop-analysis-rules-v1")
    inputs: Mapped[dict] = mapped_column(JSON)
    sources: Mapped[dict] = mapped_column(JSON)
    recommendations: Mapped[list["CropRecommendation"]] = relationship(back_populates="analysis")


class CropRecommendation(Base):
    __tablename__ = "crop_recommendations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    analysis_id: Mapped[str] = mapped_column(ForeignKey("crop_analyses.id"), index=True)
    crop_code: Mapped[str] = mapped_column(String)
    score: Mapped[float] = mapped_column(Float)
    rank: Mapped[int] = mapped_column(Integer)
    positives: Mapped[list] = mapped_column(JSON)
    negatives: Mapped[list] = mapped_column(JSON)
    warnings: Mapped[list] = mapped_column(JSON)
    constraints: Mapped[list] = mapped_column(JSON)
    analysis: Mapped[CropAnalysis] = relationship(back_populates="recommendations")


class IrrigationDecision(Base):
    __tablename__ = "irrigation_decisions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    public_code: Mapped[str] = mapped_column(String, unique=True, index=True)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"), index=True)
    farmer_id: Mapped[str] = mapped_column(ForeignKey("farmers.id"))
    farm_id: Mapped[str] = mapped_column(ForeignKey("farms.id"))
    crop_code: Mapped[str | None] = mapped_column(String, nullable=True)
    action: Mapped[str] = mapped_column(String)
    litres_estimated: Mapped[float | None] = mapped_column(Float, nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    reason_codes: Mapped[list] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column(Float)
    data_quality: Mapped[str] = mapped_column(String)
    freshness: Mapped[str] = mapped_column(String)
    rule_version: Mapped[str] = mapped_column(String, default="irrigation-engine-v1")
    mode: Mapped[str] = mapped_column(String, default="REAL")
    inputs: Mapped[dict] = mapped_column(JSON)
    sources: Mapped[dict] = mapped_column(JSON)
    explanation: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    confirmed_by: Mapped[str | None] = mapped_column(String, nullable=True)


class Command(Base):
    __tablename__ = "commands"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    farmer_id: Mapped[str] = mapped_column(String)
    farm_id: Mapped[str] = mapped_column(String)
    field_id: Mapped[str] = mapped_column(String)
    device_id: Mapped[str] = mapped_column(String)
    decision_id: Mapped[str] = mapped_column(ForeignKey("irrigation_decisions.id"))
    idempotency_key: Mapped[str] = mapped_column(String, unique=True)
    requested_by: Mapped[str] = mapped_column(String)
    auth_status: Mapped[str] = mapped_column(String, default="AUTHORIZED")
    exec_status: Mapped[str] = mapped_column(String, default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    payload: Mapped[dict] = mapped_column(JSON)
    acked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class IrrigationExecution(Base):
    __tablename__ = "irrigation_executions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    decision_id: Mapped[str] = mapped_column(ForeignKey("irrigation_decisions.id"))
    command_id: Mapped[str | None] = mapped_column(String, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    litres_estimated: Mapped[float | None] = mapped_column(Float, nullable=True)
    litres_actual: Mapped[float | None] = mapped_column(Float, nullable=True)
    litres_actual_source: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="STARTED")
    trigger: Mapped[str] = mapped_column(String, default="ENGINE")
    mode: Mapped[str] = mapped_column(String, default="REAL")


class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    farmer_id: Mapped[str] = mapped_column(String, index=True)
    farm_id: Mapped[str] = mapped_column(String)
    field_id: Mapped[str] = mapped_column(String, index=True)
    type: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    debounce_key: Mapped[str] = mapped_column(String, index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    entity: Mapped[str] = mapped_column(String)
    entity_id: Mapped[str] = mapped_column(String)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class DecisionTrace(Base):
    __tablename__ = "decision_traces"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    decision_id: Mapped[str] = mapped_column(String, index=True)
    kind: Mapped[str] = mapped_column(String)
    blob: Mapped[dict] = mapped_column(JSON)


class AiConversation(Base):
    __tablename__ = "ai_conversations"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    farmer_id: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    messages: Mapped[list] = mapped_column(JSON, default=list)
    lang: Mapped[str] = mapped_column(String, default="en")


class AiToolCall(Base):
    __tablename__ = "ai_tool_calls"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    conversation_id: Mapped[str] = mapped_column(String, index=True)
    tool: Mapped[str] = mapped_column(String)
    args: Mapped[dict] = mapped_column(JSON)
    result_summary: Mapped[str] = mapped_column(Text)
    ts: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class ModelVersion(Base):
    __tablename__ = "model_versions"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    model_name: Mapped[str] = mapped_column(String)
    version: Mapped[str] = mapped_column(String)
    dataset: Mapped[str | None] = mapped_column(String, nullable=True)
    trained_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    features: Mapped[list | None] = mapped_column(JSON, nullable=True)
    target: Mapped[str | None] = mapped_column(String, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    parameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String, default="UNAVAILABLE")
    limitations: Mapped[str] = mapped_column(Text, default="")
    sha256: Mapped[str | None] = mapped_column(String, nullable=True)


class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(String, index=True)
    scenario: Mapped[str] = mapped_column(String)
    overlay: Mapped[dict] = mapped_column(JSON)
    decision_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=uid)
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(Text)
    tags: Mapped[str] = mapped_column(String, default="")
    source: Mapped[str] = mapped_column(String, default="BUNDLED")
