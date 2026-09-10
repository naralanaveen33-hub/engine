from __future__ import annotations

from dataclasses import dataclass, field

from app.engines.water import duration_seconds, litres_for_depth
from app.enums import IrrigationAction, SensorHealthStatus

RULE_VERSION = "irrigation-engine-v1"

STAGE_DEMAND = {
    "GERMINATION": 0.7,
    "VEGETATIVE": 1.0,
    "FLOWERING": 1.25,
    "FRUITING": 1.2,
    "MATURITY": 0.6,
}

SCENARIOS = {
    "DRY_DAY": {"precip_prob": 5.0, "precip_mm": 0.0, "temp_delta": 0},
    "NORMAL_DAY": {"precip_prob": 20.0, "precip_mm": 0.0, "temp_delta": 0},
    "RAIN_TOMORROW": {"precip_prob": 75.0, "precip_mm": 8.0, "temp_delta": 0},
    "HEAVY_RAIN": {"precip_prob": 90.0, "precip_mm": 25.0, "temp_delta": 0},
    "HEAT_WAVE": {"precip_prob": 5.0, "precip_mm": 0.0, "temp_delta": 8},
    "DROUGHT": {"precip_prob": 2.0, "precip_mm": 0.0, "temp_delta": 4},
    "HIGH_HUMIDITY": {"precip_prob": 40.0, "precip_mm": 1.0, "temp_delta": 0},
}


@dataclass
class IrrigationInput:
    moisture_pct: float | None
    moisture_source: str
    moisture_health: str
    health_reasons: list[str]
    temperature_c: float | None
    humidity_pct: float | None
    rain_prob_24h: float | None
    precip_mm_24h: float | None
    weather_available: bool
    crop_code: str | None
    stage: str
    low_threshold: float
    high_threshold: float
    area_m2: float | None
    irrigation_method: str
    water_availability: str
    hours_since_irrigation: float | None
    et0_mm: float | None
    flow_lpm: float | None
    max_actuator_seconds: int
    simulation_scenario: str | None = None


@dataclass
class IrrigationResult:
    action: str
    reason_codes: list[str]
    confidence: float
    data_quality: str
    freshness: str
    litres_estimated: float | None
    duration_seconds: float | None
    duration_note: str
    water_source_label: str
    explanation: dict
    sources: dict
    inputs_snapshot: dict
    rule_version: str = RULE_VERSION
    mode: str = "REAL"


def evaluate_irrigation(inp: IrrigationInput) -> IrrigationResult:
    reasons: list[str] = []
    sources = {
        "soil_moisture": inp.moisture_source,
        "weather": "WEATHER_API" if inp.weather_available else "UNAVAILABLE",
    }
    rain_prob = inp.rain_prob_24h
    precip = inp.precip_mm_24h
    mode = "REAL"
    if inp.simulation_scenario:
        mode = "SIMULATION"
        overlay = SCENARIOS.get(inp.simulation_scenario.upper())
        if overlay:
            rain_prob = overlay["precip_prob"]
            precip = overlay["precip_mm"]
            sources["weather_overlay"] = "SIMULATION"
            reasons.append(f"SIMULATION_{inp.simulation_scenario.upper()}")

    freshness = "FRESH"
    quality = "OK"
    confidence = 0.85
    execute_blocked = False

    if inp.moisture_health in (SensorHealthStatus.INVALID, SensorHealthStatus.OFFLINE) or inp.moisture_pct is None:
        freshness = "BAD"
        quality = inp.moisture_health or "MISSING"
        confidence = 0.25
        execute_blocked = True
        reasons.append("SENSOR_UNRELIABLE")
        action = IrrigationAction.DELAY
        could = ["Fresh valid soil moisture", "Device online"]
        why = ["Sensor data is missing, stale, invalid, or offline. Irrigation is not executed blindly."]
        return _pack(inp, action, reasons, confidence, quality, freshness, None, None, "N/A", sources, why, could, mode, execute_blocked)

    if inp.moisture_health == SensorHealthStatus.WARNING:
        confidence -= 0.2
        freshness = "STALE"
        reasons.append("SENSOR_STALE")
        quality = "WARNING"

    if not inp.weather_available and mode != "SIMULATION":
        confidence -= 0.15
        reasons.append("WEATHER_UNAVAILABLE")
        quality = "PARTIAL"

    if inp.water_availability.upper() in ("NONE", "UNAVAILABLE"):
        reasons.append("WATER_SHORTAGE")
        return _pack(
            inp, IrrigationAction.DO_NOT_IRRIGATE, reasons, 0.9, quality, freshness, 0, 0, "NONE",
            sources, ["Water availability is recorded as none."], ["Water source restored"], mode, True,
        )

    if inp.hours_since_irrigation is not None and inp.hours_since_irrigation < 6:
        reasons.append("RECENT_IRRIGATION")
        return _pack(
            inp, IrrigationAction.DO_NOT_IRRIGATE, reasons, min(confidence, 0.8), quality, freshness, 0, 0, "ESTIMATED",
            sources, ["Irrigation was completed recently."], ["Soil moisture falls", "Longer gap since last irrigation"], mode, False,
        )

    demand = STAGE_DEMAND.get(inp.stage, 1.0)
    if inp.simulation_scenario and inp.simulation_scenario.upper() == "HEAT_WAVE":
        demand *= 1.2
        reasons.append("HEAT_WAVE_DEMAND")

    low = inp.low_threshold / max(demand, 0.5) * demand  # keep threshold, bump demand via comparison
    # Critical low uses stage: flowering treats "low" as slightly higher need
    adj_low = inp.low_threshold * (1.1 if demand > 1.1 else 1.0)
    adj_high = inp.high_threshold

    moisture = inp.moisture_pct
    rain_high = (rain_prob is not None and rain_prob >= 70) or (precip is not None and precip >= 10)
    rain_mod = rain_prob is not None and rain_prob >= 50

    if rain_high and moisture >= adj_low * 0.85:
        reasons.extend(["RAIN_FORECAST", "MOISTURE_NOT_CRITICAL"])
        action = IrrigationAction.DO_NOT_IRRIGATE if moisture >= adj_low else IrrigationAction.DELAY
        why = ["Rain probability or amount in the next 24h is high.", "Soil moisture is not at a critical deficit."]
        could = ["Rain does not occur", "Moisture falls below threshold"]
        return _pack(inp, action, reasons, confidence, quality, freshness, 0, 0, "ESTIMATED", sources, why, could, mode, execute_blocked)

    if rain_high and moisture < adj_low * 0.85:
        reasons.extend(["LOW_SOIL_MOISTURE", "RAIN_FORECAST"])
        action = IrrigationAction.DELAY
        why = ["Soil moisture is low, but heavy rain is forecast. Delay may be appropriate."]
        could = ["Rain fails to arrive", "Moisture continues to drop"]
        return _pack(inp, action, reasons, confidence * 0.9, quality, freshness, None, None, "ESTIMATED", sources, why, could, mode, execute_blocked)

    if moisture < adj_low:
        reasons.append("LOW_SOIL_MOISTURE")
        if rain_prob is not None and rain_prob < 30:
            reasons.append("LOW_RAIN_PROBABILITY")
        if demand > 1.1:
            reasons.append("HIGH_CROP_WATER_DEMAND")
        action = IrrigationAction.IRRIGATE
        depth = 5.0 * demand
        litres = None
        dur = None
        note = "AREA_UNKNOWN"
        if inp.area_m2 and inp.area_m2 > 0:
            litres = litres_for_depth(depth, inp.area_m2, inp.irrigation_method)
            dur, note = duration_seconds(litres, inp.flow_lpm, inp.max_actuator_seconds)
        why = ["Soil moisture is below the crop-stage threshold used by irrigation-engine-v1."]
        if rain_prob is not None:
            why.append(f"Next-24h rain probability is {rain_prob:.0f}%." if inp.weather_available or mode == "SIMULATION" else "Weather unavailable.")
        could = ["Rain arrives", "Moisture rises", "Sensor health changes"]
        return _pack(inp, action, reasons, confidence, quality, freshness, litres, dur, "ESTIMATED", sources, why, could, mode, execute_blocked, duration_note=note)

    if moisture > adj_high:
        reasons.append("HIGH_SOIL_MOISTURE")
        return _pack(
            inp, IrrigationAction.DO_NOT_IRRIGATE, reasons, confidence, quality, freshness, 0, 0, "ESTIMATED",
            sources, ["Soil moisture is already high."], ["Sustained drying"], mode, False,
        )

    reasons.append("MOISTURE_ADEQUATE")
    if rain_mod:
        reasons.append("RAIN_FORECAST")
    action = IrrigationAction.DELAY if rain_mod else IrrigationAction.DO_NOT_IRRIGATE
    why = ["Soil moisture is currently in an adequate band."]
    if rain_mod:
        why.append("Moderate rain chance supports delay.")
    return _pack(inp, action, reasons, confidence, quality, freshness, 0, 0, "ESTIMATED", sources, why, ["Moisture falls below threshold"], mode, False)


def _pack(
    inp: IrrigationInput,
    action,
    reasons,
    confidence,
    quality,
    freshness,
    litres,
    dur,
    water_label,
    sources,
    why,
    could,
    mode,
    execute_blocked,
    duration_note: str = "N/A",
) -> IrrigationResult:
    action_s = action.value if hasattr(action, "value") else str(action)
    explanation = {
        "what": action_s,
        "why": why,
        "data_used": [f"soil_moisture={inp.moisture_pct} [{inp.moisture_source}]", f"health={inp.moisture_health}"],
        "could_change": could,
        "execute_blocked": execute_blocked,
        "disclaimer": "Thresholds are engineering defaults for the hackathon, not a scientifically validated water-balance model.",
    }
    if inp.weather_available or mode == "SIMULATION":
        explanation["data_used"].append(f"rain_prob={inp.rain_prob_24h} [{sources.get('weather_overlay', sources.get('weather'))}]")
    else:
        explanation["data_used"].append("weather=UNAVAILABLE")
    return IrrigationResult(
        action=action_s,
        reason_codes=reasons,
        confidence=max(0.05, min(0.99, confidence)),
        data_quality=quality,
        freshness=freshness,
        litres_estimated=litres,
        duration_seconds=dur,
        duration_note=duration_note,
        water_source_label=water_label,
        explanation=explanation,
        sources=sources,
        inputs_snapshot={
            "moisture_pct": inp.moisture_pct,
            "stage": inp.stage,
            "crop": inp.crop_code,
            "area_m2": inp.area_m2,
            "method": inp.irrigation_method,
            "simulation": inp.simulation_scenario,
        },
        mode=mode,
    )
