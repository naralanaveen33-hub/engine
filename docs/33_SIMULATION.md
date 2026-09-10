# 33 — Simulation

## Purpose

What-if without lying about weather or touching hardware.

## Scope

Scenarios: DRY_DAY, NORMAL_DAY, RAIN_TOMORROW, HEAVY_RAIN, HEAT_WAVE, DROUGHT, HIGH_HUMIDITY.

## Architecture

```
REAL DATA → REAL DECISION
REAL DATA → overlay scenario → SIMULATED DECISION (mode=SIMULATION)
```

Overlay replaces forecast fields only (and optional synthetic moisture **if** scenario says so, labeled SIMULATION). Default rain scenarios do **not** alter real moisture.

## Inputs

Field id + scenario.

## Outputs

Decision with `mode=SIMULATION`, banner, stored `simulation_runs`.

## Data Flow

Wow-moment: real IRRIGATE vs simulated DELAY under RAIN_TOMORROW/HEAVY_RAIN.

## Dependencies

Irrigation engine.

## Failure Cases

Execute endpoint rejects SIMULATION decisions.

## Security

Cannot bind simulation decision_id to GPIO.

## MVP Implementation

POST `/simulation/scenario`. UI toggle.

## Production Extension

Monte Carlo — not MVP.

## Testing

Execute sim decision → 403.

## Limitations

Scenarios are coarse, not climate models.
