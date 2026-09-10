# 14 — Crop Analysis Engine

## Purpose

Answer: which crops are suitable **for this field** and why — by fusing ML and rules.

## Scope

Ranking + explanations. Not planting automation.

## Architecture

```
context = location, season, weather, climate, soil, water, area, previous crop, history, preference, market, catalog
ml_scores = RF if features complete
rules = rotation, water, season, preference, market (if fresh)
final = clamp(ml + rule_delta)
```

`rule_version`: `crop-analysis-rules-v1`.

## Inputs

Field aggregate DTO with sources on each leaf.

## Outputs

Ranked list: crop, suitability_score 0–100, positive_factors, negative_factors, warnings, constraints, data_sources, model_version, rule_version, timestamp.

Suitability is **not** yield, profit, or success guarantee.

## Data Flow

POST crop-analysis stores `crop_analyses` + child recommendations + trace.

## Dependencies

ML (13), rotation (15), soil/weather/climate, optional market (21).

## Failure Cases

No ML: scores from rules baseline (e.g. 50 + deltas), warning `ML_UNAVAILABLE`. No previous crop: skip rotation penalties, factor `HISTORY_UNKNOWN`. Market stale: ignore market delta, warning.

## Security

Analysis tied to farmer field.

## MVP Implementation

Deltas (illustrative, documented, tunable):

- Same botanical family as previous: -8 (not forbid)
- High water crop if water_availability=LOW: -15
- Off-season vs simple kharif/rabi table: -10
- Farmer preference match: +5
- Fresh market price above 30-day median if available: +4 (never “will profit”)

## Production Extension

Agronomist-reviewed weights; district calendars.

## Testing

Tomato after tomato still rankable; family penalty applied. Missing history: no invented previous crop.

## Limitations

Linear deltas are a prototype, not crop modeling science.
