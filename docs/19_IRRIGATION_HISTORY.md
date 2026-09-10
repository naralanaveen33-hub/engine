# 19 — Irrigation History

## Purpose

Show what was decided, confirmed, delivered, and whether it failed.

## Scope

Today / weekly / monthly aggregates of **estimated** and **actual** litres separately.

## Architecture

`irrigation_decisions` + `irrigation_executions` + `commands`. Dashboard queries by field and farm.

## Inputs

Completed executions, triggers: MANUAL, ENGINE, VOICE (still confirmed), SIMULATION (no hardware).

## Outputs

Timeline: decision → confirm → command → start → complete/fail. Totals labeled ESTIMATED vs ACTUAL.

## Data Flow

Execution ACK from device updates row. Timeout → FAILED `NO_DEVICE_ACK`.

## Dependencies

Commands (07, 33 in prompt).

## Failure Cases

Missing actual litres: show estimated only. Simulation runs excluded from “real water used”.

## Security

Farmer sees own fields only.

## MVP Implementation

GET history; UI charts simple sums.

## Production Extension

Seasonal reports; export.

## Testing

Simulation execution must not increment real water totals.

## Limitations

Without flow sensor, “total water” is estimated.
