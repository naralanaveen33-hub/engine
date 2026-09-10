# 37 — Hackathon 2-Minute Master Demo Flow

## Purpose
Reproducible 17-step judging flow demonstrating field mapping, real weather, ML crop analysis, deterministic irrigation decision, ESP32-CAM visual field monitoring, farmer confirmation, and safety execution.

## Judging Flow Script

1. **Select Farmer & Field:** Open AquaCrop → Select Farmer `demo@aquacrop.local` → Farm `Swarnandhra Demo Farm` → `Tomato Field 1`.
2. **Field GIS Mapping:** Show Leaflet map with GPS coordinates ($16.4342^\circ, 81.6981^\circ$) and exact geodesic area ($1,897.47\text{ m}^2$ / $0.4689\text{ acres}$).
3. **Crop Profile:** Show active crop (`Tomato` - Flowering) and previous crop (`Groundnut` - Legume).
4. **Live Weather:** Show live Open-Meteo REST forecast ($31^\circ\text{C}$, $72\%$ humidity, $18\%$ rain prob) tagged `WEATHER_API`.
5. **Crop Intelligence:** Run Crop Analysis. Show Random Forest ML model predictions (`crop_rf_v1`, $99.32\%$ accuracy) + rotation delta (+4 pts for pulse/legume preceding crop).
6. **Irrigation Evaluation:** Run deterministic irrigation engine. Show recommendation (`IRRIGATE` or `DELAY`).
7. **Explainability ("WHY" Drawer):** Open explainability drawer showing soil moisture threshold, 24h rain forecast, and crop stage demand factor.
8. **ESP32 Sensor Telemetry:** Show live moisture/temperature reading with `REAL_SENSOR` badge and health status (`HEALTHY`).
9. **Field Visual Monitoring (ESP32-CAM):** Open **Field Camera** view. Show live camera snapshot/stream with `REAL_CAMERA` / `SIMULATION` badge and timestamp. Highlight that camera is strictly for visual observation and cannot actuate pumps.
10. **Copilot AI Chat / Voice:** Ask AquaCrop in English or Telugu ("ఈ రోజు నీరు తడపాలా?"). Show explainable reply with source badges.
11. **Farmer Confirmation:** Click "Review & Confirm Irrigation". Show confirmation modal detailing Gross water volume ($2,222.22\text{ Litres}$) and safe duration ($120.0\text{ minutes}$).
12. **Safety Validation:** Show safety authorization checks in Engineer Status view.
13. **ESP32 Actuation:** Farmer confirms command. Command status changes to `AUTHORIZED` $\rightarrow$ `EXECUTED`. ESP32 LED/relay turns ON.
14. **Dashboard Real-Time Update:** Dashboard switches to active `IRRIGATING` state.
15. **History Audit Trail:** Show cryptographic decision trace and persistent irrigation history log.
16. **Simulation Mode ("Heavy Rain" Scenario):** Switch to Simulation Mode and select "Heavy Rain". Recommendation immediately changes to `DELAY` (Reason: `RAIN_FORECAST`).
17. **Safety Block Demonstration (Stale Sensor):** Simulate sensor disconnect ($> 10\text{ min}$). Recommendation shows `DELAY`, Execution Status shows `BLOCKED` with reason `SENSOR_UNRELIABLE`.
