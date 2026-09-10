# 40 — Implementation Roadmap

## Purpose

Phase gates for the 24-hour build.

## Scope

Phases 0–29 from the master prompt, with stop rules.

## Architecture

See 00 §17.

## Inputs

Time remaining.

## Outputs

Ordered work; optional cut line after phase 25.

## Data Flow

IMPLEMENT → TEST → VERIFY → DOCUMENT → INTEGRATE.

## Dependencies

Phase 0 complete when `docs/` exists.

## Failure Cases

Broken irrigation engine: do not start voice.

## Security

ACL tests before public demo Wi-Fi.

## MVP Implementation

**P0** docs (this folder). **P1–11** criterion 1. **P12–16** criterion 2. **P17–25** criterion 3 + wow. **P26–29** optional.

## Production Extension

Post-hackathon: Postgres, calibrations, content.

## Testing

Each phase adds tests listed in 35.

## Limitations

29 phases will not all be “production complete”.
