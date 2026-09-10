from datetime import datetime, timezone

from app.enums import SensorHealthStatus


RANGES = {
    "soil_moisture": (0.0, 100.0),
    "temperature": (-10.0, 60.0),
    "humidity": (0.0, 100.0),
}


def assess_reading(
    *,
    soil_moisture: float | None,
    temperature: float | None,
    humidity: float | None,
    ts: datetime,
    last_seen: datetime | None,
    prev_moisture: float | None,
    now: datetime | None = None,
    offline_minutes: int = 10,
) -> tuple[str, list[str]]:
    now = now or datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    reasons: list[str] = []
    status = SensorHealthStatus.HEALTHY

    if (now - ts).total_seconds() > 5 * 60 and ts > now:
        reasons.append("CLOCK_ERROR")
        status = SensorHealthStatus.INVALID
    if ts > now and (ts - now).total_seconds() > 5 * 60:
        reasons.append("CLOCK_ERROR")
        status = SensorHealthStatus.INVALID

    def _range(name: str, v: float | None):
        nonlocal status
        if v is None:
            return
        lo, hi = RANGES[name]
        if v < lo or v > hi:
            reasons.append("OUT_OF_RANGE")
            status = SensorHealthStatus.INVALID

    _range("soil_moisture", soil_moisture)
    _range("temperature", temperature)
    _range("humidity", humidity)

    if soil_moisture is not None and prev_moisture is not None:
        age_gap = abs((now - ts).total_seconds())
        if abs(soil_moisture - prev_moisture) > 40 and age_gap < 60:
            reasons.append("SPIKE")
            status = SensorHealthStatus.INVALID

    age_min = (now - ts).total_seconds() / 60
    last = last_seen or ts
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    unseen_min = (now - last).total_seconds() / 60

    if unseen_min > offline_minutes or age_min > 120:
        reasons.append("DISCONNECTED" if unseen_min > offline_minutes else "STALE")
        if status != SensorHealthStatus.INVALID:
            status = SensorHealthStatus.OFFLINE
    elif age_min > 30:
        reasons.append("STALE")
        if status == SensorHealthStatus.HEALTHY:
            status = SensorHealthStatus.WARNING
    elif age_min > 15:
        reasons.append("STALE")
        if status == SensorHealthStatus.HEALTHY:
            status = SensorHealthStatus.WARNING

    if soil_moisture is None and temperature is None:
        reasons.append("MISSING")
        status = SensorHealthStatus.OFFLINE

    return status.value, reasons
