# 30 — Offline Mode

## Purpose

Agriculture networks fail. Detect stale devices; do not irrigate blindly.

## Scope

MVP: detect offline, refuse unsafe execute, show last_seen. Not full offline-first PWA sync.

## Architecture

`last_seen_at`; command queue in DB until expiry; device store-and-forward of sensor samples (firmware buffer) optional.

## Inputs

Heartbeats.

## Outputs

“ESP32 last seen: 27 minutes ago — DEVICE OFFLINE”.

## Data Flow

Frontend cache last dashboard JSON in localStorage for display only, labeled STALE.

## Dependencies

Health (08).

## Failure Cases

Execute while offline → 409 DEVICE_OFFLINE.

## Security

Queued commands still expire.

## MVP Implementation

Firmware: retry POST readings 5×. Backend: no execute if last_seen > 10 min.

## Production Extension

True offline-first, SMS, LoRa.

## Testing

Freeze last_seen in tests.

## Limitations

MVP is online-demo with offline **detection**, not full offline operation.
