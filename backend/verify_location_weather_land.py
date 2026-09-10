"""
Direct verification script for Location, Weather, and Land Size features in AquaCrop.
"""
import sys
import asyncio
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

async def run_verification():
    print("=== AQUACROP LOCATION, WEATHER & LAND SIZE VERIFICATION ===")

    from app.db import Base, engine, SessionLocal
    from app.seed import seed_if_empty
    from app import models
    from app.providers.external import fetch_open_meteo, fetch_climate
    from app.engines.irrigation import IrrigationInput, evaluate_irrigation
    from app.engines.water import litres_for_depth, calculate_water_litres

    # 1. Initialize DB & Seed
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_if_empty(db)

    # 2. Query Field from Database
    fields = db.query(models.Field).all()
    assert fields, "No fields found in DB"
    field = fields[0]

    print("\n[1. LOCATION & LAND SIZE VERIFICATION]")
    print(f"  Field Name: {field.name}")
    print(f"  Latitude: {field.latitude}°")
    print(f"  Longitude: {field.longitude}°")
    print(f"  Field Area: {field.area_m2} m² (Source: FARMER_INPUT)")
    print(f"  Soil Type: {field.soil_type}")
    print(f"  Irrigation Method: {field.irrigation_method}")
    print(f"  Water Availability: {field.water_availability}")

    assert field.latitude is not None and field.longitude is not None
    assert field.area_m2 > 0

    # Verify Boundary GeoJSON Polygon
    boundary = db.query(models.FieldBoundary).filter_by(field_id=field.id).first()
    assert boundary is not None, "Field boundary polygon missing"
    print(f"  Boundary GeoJSON Type: {boundary.geojson.get('type')}")
    print(f"  Calculated Area: {boundary.area_m2_calculated} m²")
    print(f"  Boundary Source: {boundary.source}")

    # 3. Live Open-Meteo Weather API Test for Field Location
    lat, lon = field.latitude, field.longitude
    print(f"\n[2. OPEN-METEO WEATHER API TEST for ({lat}°, {lon}°)]")
    weather = await fetch_open_meteo(lat, lon)
    print(f"  Provider: {weather['provider']}")
    print(f"  Source Tag: {weather['source']}")
    print(f"  Current Temperature: {weather['current_temperature_c']}°C")
    print(f"  Current Humidity: {weather['current_humidity_pct']}%")
    print(f"  Current Precipitation: {weather['current_precipitation_mm']} mm")
    print(f"  Wind Speed: {weather['wind_speed']} km/h")
    print(f"  Rain Probability (24h): {weather['rain_probability_24h']}%")
    print(f"  24h Precip Sum: {weather['precip_mm_24h']} mm")
    print(f"  Evapotranspiration (ET0): {weather['et0_mm']} mm")
    print(f"  Attribution: {weather['attribution']}")

    assert weather["source"] == "WEATHER_API"
    assert weather["current_temperature_c"] is not None
    assert weather["rain_probability_24h"] is not None

    # 4. Climate ERA5 Historical Archive API Test
    print(f"\n[3. CLIMATE HISTORICAL ARCHIVE TEST for ({lat}°, {lon}°)]")
    climate = await fetch_climate(lat, lon)
    print(f"  Provider: {climate['provider']}")
    print(f"  Source Tag: {climate['source']}")
    print(f"  Period: {climate['period']}")
    print(f"  Mean Daily Precip: {climate['mean_daily_precip_mm']:.2f} mm")
    print(f"  Annual Precip Estimate: {climate['annual_precip_mm_estimate']:.2f} mm")
    print(f"  Mean Temperature: {climate['mean_temperature_c']:.2f}°C")

    assert climate["source"] == "HISTORICAL"

    # 5. Land Size Water Volume Calculation Verification
    print(f"\n[4. LAND SIZE & WATER CALCULATION VERIFICATION]")
    depth_mm = 1.0
    area_m2 = field.area_m2
    method = field.irrigation_method
    calculated_litres = litres_for_depth(depth_mm, area_m2, method)
    print(f"  Depth Requirement: {depth_mm} mm over {area_m2} m² using {method}")
    print(f"  Calculated Water Volume: {calculated_litres} Litres (Efficiency Factor Applied)")
    assert calculated_litres > 0

    # 6. Irrigation Engine Evaluation using Field Location, Soil & Live Weather Forecast
    print(f"\n[5. IRRIGATION ENGINE EVALUATION WITH LIVE WEATHER FORECAST]")
    inp = IrrigationInput(
        moisture_pct=22.0,
        moisture_source="REAL_SENSOR",
        moisture_health="HEALTHY",
        health_reasons=[],
        temperature_c=weather["current_temperature_c"],
        humidity_pct=weather["current_humidity_pct"],
        rain_prob_24h=weather["rain_probability_24h"],
        precip_mm_24h=weather["precip_mm_24h"] or 0,
        weather_available=True,
        crop_code="tomato",
        stage="FLOWERING",
        low_threshold=30.0,
        high_threshold=55.0,
        area_m2=field.area_m2,
        irrigation_method=field.irrigation_method,
        water_availability=field.water_availability,
        hours_since_irrigation=48,
        et0_mm=weather["et0_mm"],
        flow_lpm=50.0,
        max_actuator_seconds=1800,
    )
    decision = evaluate_irrigation(inp)
    print(f"  Action: {decision.action}")
    print(f"  Estimated Water Litres: {decision.litres_estimated} L (Source: {decision.water_source_label})")
    print(f"  Duration Seconds: {decision.duration_seconds} s")
    print(f"  Reason Codes: {decision.reason_codes}")
    print(f"  Why: {decision.explanation.get('why')}")
    print(f"  Data Used: {decision.explanation.get('data_used')}")

    assert decision.action in ("IRRIGATE", "DELAY", "DO_NOT_IRRIGATE")
    assert decision.litres_estimated > 0

    db.close()
    print("\n=== ALL LOCATION, WEATHER & LAND SIZE VERIFICATIONS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
