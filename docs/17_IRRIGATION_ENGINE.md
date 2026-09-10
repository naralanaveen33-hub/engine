# 17 — Irrigation Decision Engine & Safety Authorization

## Purpose
Deterministic, explainable operational recommendation for a field, separating **operational decision** from **execution authorization**.

## Decision vs. Execution Authorization Model

```text
Field Telemetry + Weather + Crop + Soil
                 ↓
      Irrigation Decision Engine
                 ↓
       [ Decision Recommendations ]
    IRRIGATE | DELAY | DO_NOT_IRRIGATE
                 ↓
          Safety Engine
                 ↓
     [ Execution Authorization ]
       AUTHORIZED | BLOCKED
                 ↓
       ESP32 Actuator Node
```

### 1. Decision Actions (`decision`)
- `IRRIGATE`: Soil moisture below stage threshold and no heavy rainfall forecast.
- `DELAY`: Soil moisture low but high rain forecast ($\ge 70\%$ prob or $\ge 10\text{ mm}$ expected rain), or moisture adequate.
- `DO_NOT_IRRIGATE`: Soil moisture in optimal band or recent irrigation within 6h.
- `NOT_EVALUABLE`: Inputs missing or invalid.

### 2. Execution Status (`execution_status`)
- `AUTHORIZED`: All safety checks pass, sensor is `FRESH`, weather data is available, and calculated runtime is within safety caps.
- `BLOCKED`: Pump command is strictly blocked due to safety block reasons (`SENSOR_UNRELIABLE`, `SENSOR_STALE`, `WEATHER_UNAVAILABLE`, `WATER_SHORTAGE`, `DURATION_EXCEEDS_SAFETY_LIMIT`).

## Response Schema Fields
- `decision`: string
- `execution_status`: `"AUTHORIZED"` | `"BLOCKED"`
- `execution_block_reasons`: list of strings
- `confidence`: float ($0.0 - 1.0$)
- `litres_estimated`: float (Gross water requirement)
- `duration_seconds`: float (Safe executable runtime)
- `duration_note`: `"EXACT_CALCULATED"` | `"DURATION_CAPPED_SAFETY"` | `"FLOW_UNCALIBRATED"`
