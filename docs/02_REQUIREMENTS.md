# 02 — Requirements

## Purpose

Capture functional and non-functional requirements that the MVP must satisfy, and those that are explicitly deferred.

## Scope

Requirements for the hackathon slice. Deferred items are listed, not silently dropped.

## Architecture

Requirements map to services: Field, Soil, Weather, Climate, CropAnalysis, Irrigation, SensorHealth, Safety, Command, Alert, AI tools, Simulation.

## Inputs

Master product prompt, hackathon timebox, verified providers (doc 44).

## Outputs

Must / should / won’t lists below.

## Data Flow

N/A (requirements catalog).

## Dependencies

None beyond product principles in doc 00.

## Failure Cases

A requirement that cannot be met (e.g. SoilGrids paused) must degrade to labeled unavailability, not fake data.

## Security

Access isolation and command safety are **must** requirements.

## MVP Implementation

### Must (demo blockers)

1. Register/login; farmer owns farms and fields.  
2. Create field with GPS, polygon/area, previous-crop prompt (known / unknown / new / no data).  
3. Field-specific weather from Open-Meteo or `WEATHER_DATA_UNAVAILABLE`.  
4. Soil: farmer observation required for demo; remote soil optional and labeled `ESTIMATED`.  
5. Crop analysis: ranked scores, factors, sources, versions.  
6. ESP32 telemetry ingest and health.  
7. Irrigation evaluate + explain.  
8. Confirm + safety + execute to actuator.  
9. History of decision → command → execution.  
10. Simulation overlay labeled `SIMULATION`.  
11. Farmer UI + engineer traces.  
12. Telugu/English text; voice if browser supports.

### Should

Alerts with debounce; mixed cropping percentages; market prices if API key present; RAG over bundled crop notes.

### Won’t (honest)

Disease from camera; FAO-validated ET-based irrigation as scientific truth; guaranteed profit; silent mixing of simulated rain into “forecast”.

## Production Extension

Multi-farm cooperatives, SMS, vernacular STT robustness, calibrated pumps, government scheme data.

## Testing

Each Must item has at least one automated or scripted verification.

## Limitations

24-hour clock; one network; one demo device.
