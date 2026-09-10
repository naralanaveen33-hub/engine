from datetime import datetime, timezone

from app.engines.irrigation import IrrigationInput, evaluate_irrigation
from app.engines.rotation import rotation_delta
from app.engines.sensor_health import assess_reading
from app.engines.water import litres_for_depth


def test_litres():
    assert round(litres_for_depth(1, 10, "DRIP"), 2) == 11.11


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


def test_crop_analysis_ml_model_loaded():
    from app.engines.crop_analysis import load_model, model_meta, analyze_crops
    load_model()
    meta = model_meta()
    assert meta.get("status") == "TRAINED"
    assert meta.get("version") == "1.0.0" or meta.get("model_version") == "crop_rf_v1"

    catalog = [
        {"code": "rice", "name_en": "Rice", "water_demand": "HIGH", "season": "KHARIF"},
        {"code": "chickpea", "name_en": "Chickpea", "water_demand": "LOW", "season": "RABI"}
    ]
    res = analyze_crops(
        catalog=catalog,
        n=90, p=42, k=43, temperature=20.8, humidity=82.0, ph=6.5, rainfall=202.9,
        feature_sources={},
        previous_code=None,
        history_status="NO_DATA",
        water_availability="HIGH",
        farmer_preference=None,
        market_bonus={},
        month=7
    )
    assert res["ml_status"] == "TRAINED"
    assert res["model_version"] == "1.0.0" or res["model_version"] == "crop_rf_v1"
    recs = res["recommendations"]
    assert len(recs) == 2
    # Rice should rank #1 for high rainfall
    assert recs[0]["crop"] == "rice"
    assert recs[0]["suitability_score"] > 80.0


def test_simulation_scenario_heavy_rain():
    inp = IrrigationInput(
        moisture_pct=25,
        moisture_source="REAL_SENSOR",
        moisture_health="OFFLINE",
        health_reasons=["MISSING"],
        temperature_c=31,
        humidity_pct=40,
        rain_prob_24h=10,
        precip_mm_24h=0,
        weather_available=False,
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
        simulation_scenario="heavy_rain_50mm",
    )
    r = evaluate_irrigation(inp)
    assert r.mode == "SIMULATION"
    assert r.action in ("DELAY", "DO_NOT_IRRIGATE")
    assert r.freshness == "FRESH"
    assert r.data_quality == "OK"
    assert "SIMULATION_HEAVY_RAIN_50MM" in r.reason_codes


def test_simulation_scenario_drought():
    inp = IrrigationInput(
        moisture_pct=35,
        moisture_source="REAL_SENSOR",
        moisture_health="OFFLINE",
        health_reasons=["MISSING"],
        temperature_c=31,
        humidity_pct=40,
        rain_prob_24h=10,
        precip_mm_24h=0,
        weather_available=False,
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
        simulation_scenario="drought_20pct",
    )
    r = evaluate_irrigation(inp)
    assert r.mode == "SIMULATION"
    assert r.action == "IRRIGATE"
    assert r.litres_estimated and r.litres_estimated > 0
    assert r.freshness == "FRESH"
    assert r.data_quality == "OK"
    assert "SIMULATION_DROUGHT_20PCT" in r.reason_codes


def test_simulation_scenario_heatwave():
    inp = IrrigationInput(
        moisture_pct=35,
        moisture_source="REAL_SENSOR",
        moisture_health="OFFLINE",
        health_reasons=["MISSING"],
        temperature_c=31,
        humidity_pct=40,
        rain_prob_24h=10,
        precip_mm_24h=0,
        weather_available=False,
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
        simulation_scenario="heatwave_38c",
    )
    r = evaluate_irrigation(inp)
    assert r.mode == "SIMULATION"
    assert r.action == "IRRIGATE"
    assert r.litres_estimated and r.litres_estimated > 0
    assert r.freshness == "FRESH"
    assert r.data_quality == "OK"
    assert "SIMULATION_HEATWAVE_38C" in r.reason_codes


