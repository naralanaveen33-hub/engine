# 35 — Testing Strategy

## Purpose

Prove engines, ACL, and failure paths.

## Scope

Unit, integration, failure, security. Firmware hardware-in-loop optional manual.

## Architecture

pytest. Fixtures: two farmers, one field each, fake weather provider.

## Inputs

CI local `pytest -q`.

## Outputs

Pass/fail. No claimed coverage % unless measured.

## Data Flow

Engines tested with dataclasses, no HTTP.

## Dependencies

App test client.

## Failure Cases

Tests must include unavailable weather and stale sensors.

## Security

Dedicated tests for injection and cross-farmer.

## MVP Implementation

### Unit

Crop rotation; mixed fractions; RF preprocess; irrigation thresholds; rain override; stage demand; water litres; sensor range/freshness; command expiry.

### Integration

Ingest → health; weather mock → irrigation; soil+history → analysis; chat tool path.

### Failure

Offline device execute; missing/stale/invalid sensor; weather/soil down; duplicate/delayed command; actuator fail ACK.

### Security

Unauthorized field/device/decision; expired command; prompt injection.

## Production Extension

Load tests; hardware CI.

## Testing

This document is the plan; tests live in `backend/tests`.

## Limitations

Browser STT not in CI.
