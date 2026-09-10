# 07 — IoT Architecture

## Purpose

How ESP32 devices attach to fields, send telemetry, and receive **authorized** actuator commands.

## Scope

Core: soil moisture, temperature, humidity, heartbeat, one actuator channel. Optional: flow, CAM (no disease).

## Architecture

```
Sensors → ESP32 → POST /sensor/readings (device token)
ESP32 loop → GET /devices/{id}/commands
API CommandService → pending command JSON
ESP32 driver/relay → LED / safe motor
ESP32 → ACK execution result
```

LLM never opens a socket to the device.

## Inputs

JSON: device_id, field_id (must match registered binding), timestamp, soil_moisture, temperature, humidity, battery, network_status.

## Outputs

Stored readings (`REAL_SENSOR`), health snapshot, pending command `{ command_id, decision_id, duration_ms, channel, expires_at }`.

## Data Flow

Register device to field in engineer UI → token issued once → firmware configured → telemetry → health → irrigation evaluate uses latest healthy reading.

## Dependencies

Sensor health (08), commands (17, 27), hardware safety (hackathon low voltage).

## Failure Cases

Clock skew: reject future timestamps >5 min; stale: health WARNING/OFFLINE. Duplicate payloads: hash+timestamp window. Offline: no execute.

## Security

Token hash at rest; field_id in body ignored if it disagrees with registered field. Rate-limit ingest.

## MVP Implementation

Arduino sketch, Wi-Fi STA, HTTP (LAN). Poll 3s. Actuator GPIO via transistor/relay module. Demo can use LED as actuator.

## Production Extension

MQTT + TLS, signed firmware, flow meter for `ACTUAL` litres, OTA.

## Testing

Fixture device token; invalid moisture 200% → INVALID; offline execute 409.

## Limitations

HTTP poll is not real-time industrial control. No high-voltage pumps on GPIO.
