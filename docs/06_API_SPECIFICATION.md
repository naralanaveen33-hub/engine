# 06 — API Specification

## Purpose

HTTP contract for UI, devices, and AI tools (tools wrap the same services).

## Scope

`/api/v1` JSON. No GraphQL.

## Architecture

Routers thin; Pydantic schemas; services own transactions.

## Inputs

JSON bodies; JWT `Authorization: Bearer`; device `X-Device-Token`; idempotency `Idempotency-Key` on execute.

## Outputs

JSON with `source` on measured/modelled fields. Errors: `{ "error": "WEATHER_DATA_UNAVAILABLE", "detail": "..." }`.

## Data Flow

UI → API → service. Device → ingest. Device ← poll commands.

## Dependencies

Auth (27), engines (14, 17).

## Failure Cases

401/403 ACL; 404; 409 duplicate command; 422 validation; 503 provider down with typed error code; 409 decision expired.

## Security

Every field-scoped route loads field and asserts `field.farmer_id == current.farmer_id` (engineers may read). Execute requires farmer (or admin) plus safety.

## MVP Implementation

```
POST /auth/register
POST /auth/login
GET  /me

POST /farms
GET  /farms
GET  /farms/{id}

POST /fields
GET  /fields
GET  /fields/{id}
PUT  /fields/{id}
GET  /fields/{id}/map  (boundary + area)

GET  /crops
POST /fields/{id}/crop
GET  /fields/{id}/crop-history
POST /fields/{id}/crop-history
POST /fields/{id}/crop-analysis
GET  /fields/{id}/crop-recommendations

GET  /fields/{id}/soil
POST /fields/{id}/soil-observation

GET  /fields/{id}/weather
GET  /fields/{id}/climate

GET  /fields/{id}/market

POST /sensor/readings
GET  /fields/{id}/sensors
GET  /devices/{id}/status
GET  /devices/{id}/commands
POST /devices/{id}/commands/{command_id}/ack

POST /fields/{id}/irrigation/evaluate
GET  /fields/{id}/irrigation/history
POST /irrigation/{decision_id}/confirm
POST /irrigation/{decision_id}/execute

POST /ai/chat
POST /ai/voice

POST /simulation/scenario
GET  /simulation/{id}

GET  /alerts
POST /alerts/{id}/acknowledge

GET  /engineer/status
GET  /irrigation/{decision_id}/trace
```

Source-labeled value shape:

```json
{ "value": 24.0, "unit": "percent", "source": "REAL_SENSOR", "observed_at": "...", "quality": "FRESH" }
```

## Production Extension

OpenAPI published; pagination; webhooks.

## Testing

pytest + httpx AsyncClient; security tests from doc 35.

## Limitations

No bulk export in MVP.
