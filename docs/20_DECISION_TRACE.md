# 20 — Decision Trace

## Purpose

Every important recommendation is auditable.

## Scope

Irrigation and crop analysis traces. AI explanations reference the same IDs.

## Architecture

`decision_traces.blob_json` plus relational columns. Public code `IRR-YYYY-nnnnn`.

## Inputs

Engine snapshot: inputs, sources, rules, model_version, output, reason_codes, confidence.

## Outputs

GET `/irrigation/{id}/trace` for engineer and farmer explanation view (farmer sees simplified).

## Data Flow

Created atomically with the decision.

## Dependencies

Engines 14 and 17.

## Failure Cases

If persist fails, API returns error — do not actuate without stored decision.

## Security

Trace contains field data — ACL apply. Redact other farmers.

## MVP Implementation

Example:

```
Decision ID: IRR-2026-00042
Soil Moisture 24% [REAL_SENSOR]
Rain probability 12% [WEATHER_API]
Crop tomato stage FLOWERING
Result IRRIGATE
Reasons LOW_SOIL_MOISTURE, LOW_RAIN_PROBABILITY
Rule irrigation-engine-v1
```

## Production Extension

Hash-chained audit; export to regulator.

## Testing

Evaluate creates trace; execute references same id.

## Limitations

JSON blob not a formal provenance graph (W3C PROV).
