# 26 — Alert System

## Purpose

Notify without spam.

## Scope

Types: LOW_SOIL_MOISTURE, HEAVY_RAIN_EXPECTED, IRRIGATION_RECOMMENDED, IRRIGATION_DELAYED, SENSOR_OFFLINE, SENSOR_STALE, DEVICE_OFFLINE, WATER_SHORTAGE, ACTUATOR_FAILURE, ABNORMAL_SENSOR_READING, CROP_ANALYSIS_UPDATED, WEATHER_CHANGED.

Severity INFO, WARNING, CRITICAL.

## Architecture

`AlertService.emit(type, field, ...)` with `debounce_key` (field+type) cooldown e.g. 2 hours unless severity escalates.

## Inputs

Engine and health events.

## Outputs

Persisted alerts; GET list; acknowledge.

## Data Flow

Evaluate irrigation may emit IRRIGATE/DELAY alerts. Health OFFLINE emits DEVICE_OFFLINE.

## Dependencies

In-process calls.

## Failure Cases

DB error logged; do not block sensor ingest.

## Security

ACL by farmer.

## MVP Implementation

Dashboard badge; engineer sees raw types.

## Production Extension

FCM/SMS.

## Testing

Two identical LOW_SOIL_MOISTURE within cooldown → one row.

## Limitations

No SMS in MVP.
