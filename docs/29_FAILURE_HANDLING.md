# 29 — Failure Handling

## Purpose

Degrade honestly.

## Scope

Sensor, weather, soil, market, backend, network, ESP32, duplicates, delayed commands, actuator, invalid values, AI, voice.

## Architecture

Typed error codes; UI banners; engine reason codes; never fill with random.

## Inputs

Exceptions from providers and devices.

## Outputs

User-visible sentences e.g. “Weather data is unavailable. The recommendation is based only on available validated field information.”

## Data Flow

Provider adapters catch HTTP errors → domain error. Engines accept optional weather=None.

## Dependencies

All providers.

## Failure Cases

Listed in purpose. Duplicate command: 409 same command_id. Delayed command past expires_at: EXPIRED, device must ignore.

## Security

Failures must not open ACL holes (fail closed on execute).

## MVP Implementation

httpx timeouts. Actuator fail ACK → ACTUATOR_FAILURE alert.

## Production Extension

Retry with backoff for providers; circuit breakers.

## Testing

Weather 503 path; expired command ignored.

## Limitations

No multi-region failover.
