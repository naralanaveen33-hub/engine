# 17 — Irrigation Decision Engine

## Purpose

Deterministic, explainable operational recommendation for a field.

## Scope

Actions IRRIGATE, DELAY, DO_NOT_IRRIGATE. Estimates water and duration. Simulation overlay supported.

## Architecture

`irrigation-engine-v1` pure function + persistence wrapper.

Priority for **current** moisture: valid fresh REAL_SENSOR > farmer observation > estimate > simulation. Forecast still combined.

## Inputs

Soil moisture + health, T, H, precip probability / amount, crop, stage, soil texture (optional), area, method, water availability, last irrigation, ET0 optional, simulation scenario optional.

## Outputs

Action, estimated_water_litres (`ESTIMATED`), estimated_duration, schedule hint, priority, reason_codes, confidence 0–1, data_quality, data_freshness, sources, rule_version, decision public_code e.g. `IRR-2026-00001`.

## Data Flow

Evaluate → store decision (expires e.g. 2h) → explain → confirm → execute (real mode only).

## Dependencies

Water calc (18), health (08), weather (10), safety (27).

## Failure Cases

Stale sensor: no execute; may still recommend with low confidence. Weather unavailable: no rain-override; reason `WEATHER_UNAVAILABLE`. Water_availability=NONE: DO_NOT_IRRIGATE `WATER_SHORTAGE`.

## Security

Evaluate is read-ish (creates decision row). Execute separate.

## MVP Implementation

Moisture bands by crop profile (e.g. tomato flowering low threshold 35% — **profile assumption**, not validated FAO).

Rules (order):

1. INVALID/OFFLINE moisture → DELAY, `SENSOR_UNRELIABLE`, confidence ≤ 0.3, execute blocked.  
2. Recent irrigation within 6h → DO_NOT_IRRIGATE `RECENT_IRRIGATION`.  
3. Precip probability next 24h ≥ 70% or precip ≥ 10 mm → DELAY if moisture not critically low; DO_NOT_IRRIGATE if moisture adequate. `RAIN_FORECAST`.  
4. Moisture below low threshold and rain low → IRRIGATE `LOW_SOIL_MOISTURE`.  
5. Moisture in band → DELAY `MOISTURE_ADEQUATE`.  
6. Moisture high → DO_NOT_IRRIGATE `HIGH_SOIL_MOISTURE`.

Heat wave simulation raises demand; heavy rain simulation forces DELAY/DO_NOT.

## Production Extension

ET-based soil water balance with calibrated sensors.

## Testing

Low moisture + heavy rain tomorrow → DELAY. Low + dry → IRRIGATE. Stale → block execute.

## Limitations

Thresholds are engineering defaults for demo, not scientifically validated for all soils.
