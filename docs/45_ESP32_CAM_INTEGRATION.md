# 45 — ESP32-CAM Visual Field Monitoring Integration

## Overview
The ESP32-CAM module serves as an isolated **visual field monitoring device** in the AquaCrop platform.

> 🚨 **SAFETY MANDATE:** The ESP32-CAM is strictly an observation device. It has **no pump actuators, relay control, or physical irrigation outputs**. It MUST NEVER directly control the irrigation pump.

## Architecture

```text
ESP32-CAM Node
     ↓ (HTTP /stream or /snapshot)
FastAPI Camera Service (/api/v1/fields/{id}/camera/*)
     ↓ (JSON + Image Stream)
React Web Application (FieldCameraCard)
     ↓
Visual Field Monitoring & Historical Inspection
```

## Security & Access Control
- Camera devices are registered under a specific `field_id` and owned by a validated `farmer_id`.
- The backend validates session authentication and field authorization prior to proxying or returning snapshot endpoints.
- Arbitrary external camera URLs supplied by frontend clients are strictly rejected to prevent SSRF vulnerabilities.

## Web UI States
- `ONLINE`: Live image feed / real-time camera snapshot with `REAL_CAMERA` source badge.
- `OFFLINE` / `SIMULATION`: Visual indicator showing device connection status with `SIMULATION` source badge.
- `FULLSCREEN`: Expanded high-resolution viewing modal for field inspection.
