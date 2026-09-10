from datetime import datetime, timezone

from app.engines.irrigation import IrrigationInput, evaluate_irrigation
from app.engines.rotation import rotation_delta
from app.engines.sensor_health import assess_reading
from app.engines.water import litres_for_depth


def test_litres():
    assert litres_for_depth(1, 10, "DRIP") == 9.0


def test_same_family_soft_penalty():
    d, _, neg = rotation_delta("tomato", "chilli")
    assert d == -8
    assert neg
    d2, _, _ = rotation_delta("tomato", "tomato")
    assert d2 == -8


def test_unknown_history_no_penalty():
    d, p, n = rotation_delta(None, "tomato")
    assert d == 0 and not p and not n


def test_rain_delay():
    inp = IrrigationInput(
        moisture_pct=28,
        moisture_source="REAL_SENSOR",
        moisture_health="HEALTHY",
        health_reasons=[],
        temperature_c=31,
        humidity_pct=50,
        rain_prob_24h=90,
        precip_mm_24h=20,
        weather_available=True,
        crop_code="tomato",
        stage="FLOWERING",
        low_threshold=32,
        high_threshold=55,
        area_m2=400,
        irrigation_method="DRIP",
        water_availability="MODERATE",
        hours_since_irrigation=48,
        et0_mm=5,
        flow_lpm=None,
        max_actuator_seconds=30,
        simulation_scenario=None,
    )
    r = evaluate_irrigation(inp)
    assert r.action in ("DELAY", "DO_NOT_IRRIGATE")
    assert "RAIN_FORECAST" in r.reason_codes


def test_dry_irrigate():
    inp = IrrigationInput(
        moisture_pct=18,
        moisture_source="REAL_SENSOR",
        moisture_health="HEALTHY",
        health_reasons=[],
        temperature_c=31,
        humidity_pct=40,
        rain_prob_24h=10,
        precip_mm_24h=0,
        weather_available=True,
        crop_code="tomato",
        stage="FLOWERING",
        low_threshold=32,
        high_threshold=55,
        area_m2=400,
        irrigation_method="DRIP",
        water_availability="MODERATE",
        hours_since_irrigation=48,
        et0_mm=5,
        flow_lpm=None,
        max_actuator_seconds=30,
    )
    r = evaluate_irrigation(inp)
    assert r.action == "IRRIGATE"
    assert r.litres_estimated and r.litres_estimated > 0
    assert r.water_source_label == "ESTIMATED"


def test_stale_blocks_confidence():
    inp = IrrigationInput(
        moisture_pct=18,
        moisture_source="REAL_SENSOR",
        moisture_health="OFFLINE",
        health_reasons=["STALE"],
        temperature_c=31,
        humidity_pct=40,
        rain_prob_24h=10,
        precip_mm_24h=0,
        weather_available=True,
        crop_code="tomato",
        stage="FLOWERING",
        low_threshold=32,
        high_threshold=55,
        area_m2=400,
        irrigation_method="DRIP",
        water_availability="MODERATE",
        hours_since_irrigation=48,
        et0_mm=None,
        flow_lpm=None,
        max_actuator_seconds=30,
    )
    r = evaluate_irrigation(inp)
    assert r.action == "DELAY"
    assert r.explanation["execute_blocked"] is True


def test_simulation_heavy_rain_does_not_claim_weather_api():
    inp = IrrigationInput(
        moisture_pct=18,
        moisture_source="REAL_SENSOR",
        moisture_health="HEALTHY",
        health_reasons=[],
        temperature_c=31,
        humidity_pct=40,
        rain_prob_24h=10,
        precip_mm_24h=0,
        weather_available=True,
        crop_code="tomato",
        stage="FLOWERING",
        low_threshold=32,
        high_threshold=55,
        area_m2=400,
        irrigation_method="DRIP",
        water_availability="MODERATE",
        hours_since_irrigation=48,
        et0_mm=None,
        flow_lpm=None,
        max_actuator_seconds=30,
        simulation_scenario="HEAVY_RAIN",
    )
    r = evaluate_irrigation(inp)
    assert r.mode == "SIMULATION"
    assert r.action in ("DELAY", "DO_NOT_IRRIGATE")
    assert r.sources.get("weather_overlay") == "SIMULATION"


def test_sensor_out_of_range():
    st, reasons = assess_reading(
        soil_moisture=140,
        temperature=30,
        humidity=50,
        ts=datetime.now(timezone.utc),
        last_seen=datetime.now(timezone.utc),
        prev_moisture=30,
    )
    assert st == "INVALID"
    assert "OUT_OF_RANGE" in reasons
