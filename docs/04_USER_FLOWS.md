# 04 — User Flows

## Purpose

Specify farmer, engineer, and demo-judge journeys.

## Scope

Happy paths and explicit failure UX. No silent retries that invent data.

## Architecture

All flows hit FastAPI with JWT except device ingest (device token).

## Inputs

User actions: login, map draw, crop analysis, irrigation evaluate, voice, confirm, simulate.

## Outputs

Screens and API sequences.

## Data Flow

### Flow A — Onboard field

1. Register/login.  
2. Create farm (name, optional farm GPS).  
3. Create field: name, draw polygon or drop pin, computed area, irrigation method, water source.  
4. Prompt: “What crop was previously grown?” → Known crop | Unknown | New field | No historical data. Never auto-fill.  
5. Optional soil observation (pH, N, P, K, texture) source `FARMER_INPUT`.

### Flow B — Crop analysis (success criterion 1)

Select field → Analyze crop → backend gathers weather/climate/soil/history → ML (if loaded) + rules → ranked list with WHY / RISKS / sources.

### Flow C — Irrigation (success criterion 2–3)

Dashboard shows moisture source-labeled → Evaluate irrigation → explanation card → Ask AquaCrop / Confirm → safety → command → device poll → actuator → history.

### Flow D — Voice

Speak Telugu/English → STT → chat endpoint → tools → engine → TTS. Irrigation intent always asks confirmation.

### Flow E — Simulation wow-moment

Keep real moisture. Overlay `HEAVY_RAIN` / `RAIN_TOMORROW`. Re-evaluate. Banner `SIMULATION MODE`. No GPIO.

### Flow F — Engineer

Toggle Engineer mode: raw readings, health, provider status, decision IDs, reason codes, model/rule versions, tool calls.

## Dependencies

Frontend spec (31), API (06), voice (24–25).

## Failure Cases

Weather fail: analysis continues with warning, irrigation confidence down. Device offline: execute rejected. STT fail: show text box.

## Security

Confirmation is a button/API with JWT, not a phrase the model echoes.

## MVP Implementation

Seed user `demo@aquacrop.local` with one farm and one field near Swarnandhra (Palakol / Narsapur region coordinates documented in seed).

## Production Extension

Multi-step agronomist review; SMS confirm.

## Testing

Playwright or manual demo checklist (37). API tests for confirm/execute.

## Limitations

Browser STT quality varies for code-mixed Telugu.
