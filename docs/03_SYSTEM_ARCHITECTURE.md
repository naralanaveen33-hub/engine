# 03 — System Architecture

## Purpose

Describe runtime components, trust boundaries, and how deterministic engines relate to the LLM.

## Scope

Hackathon monolith: one API process, one SPA, one SQLite file, N ESP32 devices.

## Architecture

```
[Farmer browser]
  Dashboard | Map | Crop analysis | Irrigation | Voice
        | HTTP JSON + JWT
[FastAPI]
  routers → services → domain engines → repositories
        | httpx
[Open-Meteo] [optional SoilGrids] [optional Groq] [optional data.gov.in]
        | SQLAlchemy
[SQLite]
        | HTTP poll + ingest
[ESP32] -- sensors; driver --> LED/relay/pump (low voltage)
```

**Trust boundary:** browser and ESP32 are untrusted. API authorizes every read/write. LLM is inside the API trust zone for *network* but **untrusted for authorization and agronomy math**.

In-process “events” are Python calls (`AlertService.emit`) — no message broker.

## Inputs

HTTP from UI/device; provider JSON; local ML joblib artifact.

## Outputs

JSON APIs, decision traces, GPIO commands (via poll).

## Data Flow

1. Field selected → lat/lon.  
2. WeatherProvider.fetch(lat, lon) → store with source `WEATHER_API`.  
3. SoilService.merge(farmer test, optional remote).  
4. CropAnalysisEngine.rank(field).  
5. Sensor ingest → SensorHealthService.  
6. IrrigationEngine.evaluate(field, mode=REAL|SIMULATION).  
7. On confirm: SafetyService + CommandService.  
8. Device polls pending command.

## Dependencies

Docs 05–07, 14, 17, 22, 27, 32, 44.

## Failure Cases

Provider timeouts (5–8s), SQLite lock (single writer), device unreachable (`OFFLINE`).

## Security

Separate user JWT and `X-Device-Token`. CORS limited to frontend origin. No LLM-to-GPIO path.

## MVP Implementation

Package: `backend/app` with `api/`, `services/`, `engines/`, `providers/`, `models/`, `schemas/`. Frontend `frontend/`. Firmware `firmware/esp32/`.

## Production Extension

Split workers, Postgres, MQTT with mutual TLS, object storage for CAM.

## Testing

Contract tests for provider adapters; engine unit tests do not call network.

## Limitations

Single-node; not HA. Poll interval (e.g. 3s) limits actuation latency.
