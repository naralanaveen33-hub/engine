# 08 — Sensor Health

## Purpose

`SensorHealthService` prevents irrigation (and crop moisture facts) from using bad telemetry.

## Scope

Per-device and per-channel health. Statuses: HEALTHY, WARNING, OFFLINE, INVALID.

## Architecture

On each ingest and on evaluate: compute freshness, range, rate-of-change, duplicates, timestamp sanity.

## Inputs

Latest readings, previous reading, `last_seen_at`, configured ranges.

## Outputs

Status + reason codes (`STALE`, `OUT_OF_RANGE`, `SPIKE`, `DUPLICATE`, `CLOCK_ERROR`, `MISSING`, `DISCONNECTED`).

## Data Flow

Reading stored even if INVALID (audit) but irrigation engine ignores INVALID/OFFLINE for auto-execute; WARNING reduces confidence.

## Dependencies

Device last_seen; configurable thresholds.

## Failure Cases

No reading ever: OFFLINE + `MISSING`. Age > 30 min: WARNING; > 2 h: OFFLINE for irrigation execute.

## Security

Health cannot be overridden by LLM tool arguments.

## MVP Implementation

| Check | Rule (v1) |
| --- | --- |
| Moisture | 0–100% |
| Temperature | -10–60 °C |
| Humidity | 0–100% |
| Fresh | age ≤ 15 min HEALTHY; ≤ 30 min WARNING |
| Spike | Δ moisture > 40 points in < 60 s → INVALID |
| Offline | last_seen > 10 min |

UI copy example: “Soil moisture reading is 9 hours old. Irrigation confidence has been reduced.”

## Production Extension

Per-sensor calibration curves; hysteresis; fleet dashboards.

## Testing

Unit tests for each reason code.

## Limitations

Thresholds are engineering defaults, not crop-lab calibrated for every soil type.
