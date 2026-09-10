# 34 — Observability

## Purpose

Engineer dashboard metrics for the demo.

## Scope

API latency (simple middleware), device heartbeat age, sensor freshness, weather/soil/market/LLM status, command status counts, error rate, failed actuator.

## Architecture

In-memory counters + DB queries. GET `/engineer/status`.

## Inputs

Middleware timestamps; last provider success/fail.

## Outputs

JSON + engineer UI.

## Data Flow

Provider adapters record last_error.

## Dependencies

Engineer role.

## Failure Cases

Metrics process-local; restart resets counters.

## Security

Engineer/admin only.

## MVP Implementation

No Prometheus required.

## Production Extension

OpenTelemetry.

## Testing

After mock weather fail, status shows down.

## Limitations

Not a full APM.
