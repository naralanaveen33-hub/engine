# 08 — Sensor Health & Telemetry Validation

## Purpose
`SensorHealthService` prevents irrigation decisions and soil state assessments from utilizing bad, corrupted, or stale telemetry.

## Defined Sensor States

| Status | Definition | Execution Behavior |
| :--- | :--- | :--- |
| **FRESH** | Recent valid telemetry reading ($\le 10\text{ minutes}$ old). | Execution Status = `AUTHORIZED` (if moisture below threshold). |
| **STALE** | Telemetry exists but reading exceeds freshness threshold ($> 10\text{ minutes}$ old). | Confidence penalty applied (-0.20). Execution Status = `BLOCKED` with reason `SENSOR_STALE`. |
| **OFFLINE** | Device is not communicating over Wi-Fi network ($> 10\text{ minutes}$ since ping). | Execution Status = `BLOCKED` with reason `SENSOR_UNRELIABLE`. |
| **INVALID** | Reading exists but fails range checks ($0-100\%$) or rate-of-change spike validation. | Execution Status = `BLOCKED` with reason `SENSOR_UNRELIABLE`. |

## Decision vs Execution Authorization
- **Operational Decision:** Deterministic decision engine evaluates current state (e.g. `DELAY` or `IRRIGATE`).
- **Safety Execution Engine:** Checks sensor health. If status is `STALE`, `OFFLINE`, or `INVALID`, execution status is set to `BLOCKED` with explicit block reason, preventing physical pump commands.
