from enum import StrEnum


class DataSource(StrEnum):
    REAL_SENSOR = "REAL_SENSOR"
    WEATHER_API = "WEATHER_API"
    EXTERNAL_API = "EXTERNAL_API"
    FARMER_INPUT = "FARMER_INPUT"
    HISTORICAL = "HISTORICAL"
    ESTIMATED = "ESTIMATED"
    MODEL_OUTPUT = "MODEL_OUTPUT"
    SIMULATION = "SIMULATION"
    AI_EXPLANATION = "AI_EXPLANATION"
    IMPORTED_DATA = "IMPORTED_DATA"


class UserRole(StrEnum):
    FARMER = "farmer"
    ENGINEER = "engineer"
    ADMIN = "admin"


class HistoryStatus(StrEnum):
    KNOWN = "KNOWN"
    UNKNOWN = "UNKNOWN"
    NEW_FIELD = "NEW_FIELD"
    NO_DATA = "NO_DATA"


class GrowthStage(StrEnum):
    GERMINATION = "GERMINATION"
    VEGETATIVE = "VEGETATIVE"
    FLOWERING = "FLOWERING"
    FRUITING = "FRUITING"
    MATURITY = "MATURITY"


class IrrigationAction(StrEnum):
    IRRIGATE = "IRRIGATE"
    DELAY = "DELAY"
    DO_NOT_IRRIGATE = "DO_NOT_IRRIGATE"


class SensorHealthStatus(StrEnum):
    HEALTHY = "HEALTHY"
    WARNING = "WARNING"
    OFFLINE = "OFFLINE"
    INVALID = "INVALID"


class DecisionMode(StrEnum):
    REAL = "REAL"
    SIMULATION = "SIMULATION"


class CommandStatus(StrEnum):
    PENDING = "PENDING"
    AUTHORIZED = "AUTHORIZED"
    SENT = "SENT"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
