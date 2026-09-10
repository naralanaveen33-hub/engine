# 03 — System Architecture

## Purpose
Describe runtime components, trust boundaries, deterministic engines, and ESP32-CAM visual monitoring architecture.

## Scope
AquaCrop Monolith: FastAPI backend API, React SPA frontend, SQLite database, N ESP32 sensor/actuator nodes, and isolated ESP32-CAM visual field monitoring nodes.

## Master System Architecture

```text
                               AQUACROP PLATFORM
                                       │
                    ┌──────────────────┴──────────────────┐
                    ↓                                     ↓
             React Web Dashboard                  Voice Assistant UI
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ↓
                             FastAPI BACKEND API
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       ↓                               ↓                               ↓
 Field/Farm Management            Crop Intelligence              Weather & Soil
 (GIS Geodesic Polygon)          (Random Forest ML + Rules)      (Open-Meteo REST)
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       ↓
                           Irrigation Decision Engine
                                       ↓
                            Safety Engine (120m Cap)
                                       ↓
                            Execution Authorization
                                       ↓
                              ESP32 Telemetry Node
                                       ↓
                             Pump & Relay Actuator


─────────────────────────────────────────────────────────────────────────────
                             VISUAL MONITORING
─────────────────────────────────────────────────────────────────────────────

                              ESP32-CAM Node
                                   ↓
                         Camera HTTP Stream / Snapshot
                                   ↓
                       FastAPI Backend Camera API
                                   ↓
                       React Web Application UI
                                   ↓
                           Field Visual Monitoring
```

> 🚨 **CRITICAL SAFETY MANDATE:** The ESP32-CAM is strictly an observation device. It has **no pump actuators, relay control, or physical irrigation outputs**. It MUST NEVER directly control the irrigation pump.

## Trust Boundaries
- **Browser and Hardware Nodes:** Untrusted endpoints. The API authorizes every read/write using JWTs and `X-Device-Token`.
- **LLM / Copilot:** Untrusted for agronomy math, water volume calculations, or hardware commands.
- **Safety Engine:** Enforces max execution caps (120 min / 7,200s safety limit) and blocks actuation if sensor data is `OFFLINE`, `STALE`, or `INVALID`.
