# 42 — Data Lineage

## Purpose

Every important value exposes `source`.

## Scope

UI tags and API fields. Allowed sources: REAL_SENSOR, WEATHER_API, EXTERNAL_API, FARMER_INPUT, HISTORICAL, ESTIMATED, MODEL_OUTPUT, SIMULATION, AI_EXPLANATION.

## Architecture

Pydantic `SourcedValue`. Frontend `SourceTag`.

## Inputs

Providers and engines set source; LLM cannot retag.

## Outputs

Example:

```
Soil moisture 24% [REAL_SENSOR]
Temp 31.2°C [REAL_SENSOR]
Rain 75% [WEATHER_API]
Previous crop groundnut [FARMER_INPUT]
pH 6.8 [FARMER_INPUT] or [ESTIMATED]
Suitability 87 [MODEL_OUTPUT + rules]
Water 120 L [ESTIMATED]
```

## Data Flow

Trace stores the sourced snapshot.

## Dependencies

All services.

## Failure Cases

Missing source → reject serialization in engines (default forbidden).

## Security

Lineage is not an ACL substitute.

## MVP Implementation

Required on irrigation and crop analysis payloads.

## Production Extension

OpenLineage.

## Testing

Schema rejects unlabeled moisture in decisions.

## Limitations

Not a complete column-level warehouse lineage.
