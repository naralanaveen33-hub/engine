# AquaCrop — Repository Inspection and Implementation Plans

**Inspected:** 2026-09-10  
**Workspace:** `E:\engine`  
**Status:** Greenfield. No application to overwrite.

## Purpose

Record what exists in this workspace before any implementation, resolve architecture choices, and freeze the hackathon build plan.

---

## 1. Repository analysis

| Item | Finding |
| --- | --- |
| Git remote / app code | None found |
| Application source | None |
| Backend | None |
| Frontend | None |
| Database | None |
| ML artifacts | None |
| Firmware | None |
| Tests | None |
| Dependencies | None (`requirements.txt`, `package.json`, lockfiles absent) |
| Documentation | None except unused Obsidian vault |

Existing paths:

- `aqce/` — unused Obsidian vault (`Welcome.md` + `.obsidian/`). **Leave untouched.** AquaCrop lives at repository root, not inside the vault.

There is no working functionality to reuse. This is a new product, not a refactor.

---

## 2. Existing feature analysis

Nothing implemented:

- No farmer / farm / field model
- No weather, soil, climate, or market providers
- No sensors, irrigation engine, AI agent, or voice
- No authentication, APIs, or UI

---

## 3. Missing feature analysis

Everything in the master prompt is missing. For a 24-hour hackathon, **do not attempt all 29 implementation phases as production systems**. Build a credible end-to-end slice:

**Must work for demo (success criteria 1–3):**

1. Field + GPS + weather + soil + previous crop + crop analysis ranking + explanation  
2. ESP32 sensors → validation → irrigation engine → explanation  
3. AI explanation → farmer confirmation → safety → authorized actuator → history + simulation wow-moment  

**Defer if time-constrained:** ESP32-CAM disease claims, advanced ML, full offline-first mesh, live mandi profit claims, RAG at web-crawler scale.

---

## 4. Architecture analysis

### Product shape

AquaCrop is a **field-centric decision system**, not a chatbot dashboard.

```
Farmer UI / Voice
        ↓
   FastAPI (auth + tools)
        ↓
  Domain services (deterministic)
        ↓
 Providers (weather, soil, climate, market, LLM, STT/TTS)
        ↓
 SQLite (MVP) / PostgreSQL (later)
        ↓
 ESP32 (telemetry in, authorized commands out)
```

### Conflicts resolved

| Conflict | Decision |
| --- | --- |
| LLM vs engines | LLM explains and routes tools. Engines decide irrigation, crop ranking adjustments, water volume, safety. |
| Real vs simulated | Every value has `source`. Simulation never writes to actuators unless a separate explicit hardware-test flag is set (default off). |
| Farm vs field weather | Weather keyed by **field lat/lon**, never farm centroid when field coords exist. |
| SoilGrids vs lab tests | SoilGrids (if reachable) = `ESTIMATED` background. Farmer/lab entries = `FARMER_INPUT` / soil-test source. Never conflate. |
| ML vs extra app features | Random Forest trained only on dataset columns (N, P, K, temperature, humidity, pH, rainfall). Previous crop, market, preference, area stay in **rule layer**. |
| PostgreSQL vs SQLite | **SQLite for hackathon**. SQLAlchemy models stay vendor-neutral. |
| Event bus | In-process Python events / service calls. No Kafka/RabbitMQ. |
| Maps | Leaflet + OpenStreetMap (no paid Google Maps key required). |
| Frontend | React + Vite + TypeScript. Farmer mode default; Engineer mode behind role. |

---

## 5. Dependency analysis

### Backend (Python 3.11+)

- FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2, Alembic
- python-jose / PyJWT, passlib[bcrypt], httpx
- scikit-learn, joblib, pandas, numpy
- pytest, pytest-asyncio
- Optional: groq / openai-compatible client

### Frontend

- React 18, Vite, TypeScript, React Router
- Leaflet, react-leaflet
- Web Speech API (browser) for hero voice path

### IoT

- ESP32 Arduino or ESP-IDF sketch: HTTPS/HTTP JSON telemetry + command poll
- Soil moisture analog/capacitive, DHT22 or equivalent T/H
- Relay/LED/servo actuator via driver — **never raw high voltage on GPIO**

### External (verified 2026-09-10)

See `44_API_PROVIDER_VERIFICATION.md`.

| Provider | Role | Auth | Hackathon stance |
| --- | --- | --- | --- |
| Open-Meteo Forecast + Archive + ET0 | Weather + climate | None (non-commercial) | **Primary. Required.** |
| ISRIC SoilGrids REST v2 | Background soil | None, 5/min, **REST currently unreliable/paused** | Optional. Fail → `SOIL_PROVIDER_UNAVAILABLE`. |
| Farmer soil observation | Actual soil | Local DB | **Primary soil for demo.** |
| data.gov.in Agmarknet resource `9ef84268-d588-465a-a308-a864a43d0070` | Mandi prices | API key | Optional. No key → `MARKET_DATA_UNAVAILABLE`. |
| Groq OpenAI-compatible + Whisper | LLM + optional STT | API key, free tier rate limits | Optional. No key → templated explanations still work. |
| Browser Web Speech | Telugu/English STT/TTS | None | **Primary voice path.** |

Do not invent fallback weather, soil lab values, market prices, or ML accuracy.

---

## 6. Database plan

SQLAlchemy models, SQLite file `aquacrop.db`.

Core entities (see `05_DATABASE_DESIGN.md`):

- Identity: `users`, `farmers` (1:1 with farmer-role users)
- Land: `farms`, `fields`, `field_boundaries`
- Crops: `crops`, `crop_profiles`, `field_crops`, `crop_history`
- Environment: `soil_profiles`, `soil_observations`, `weather_observations`, `weather_forecasts`, `climate_summaries`, `market_observations`
- IoT: `devices`, `sensors`, `sensor_readings`, `sensor_health_snapshots`
- Decisions: `crop_analyses`, `crop_recommendations`, `irrigation_decisions`, `irrigation_executions`, `decision_traces`
- Control: `commands`, `command_authorizations`
- Ops: `alerts`, `audit_logs`, `ai_conversations`, `ai_tool_calls`, `voice_interactions`, `model_versions`, `simulation_runs`

Every operational numeric fact stores `source` from the allowed source enum.

---

## 7. API plan

Version prefix: `/api/v1`.

Auth: JWT access token. Device ingest: device token (separate from farmer JWT).

Minimum routes for demo: auth, farms, fields, crop history, soil, weather, crop-analysis, sensor ingest, irrigation evaluate/confirm/execute, alerts, AI chat/voice, simulation, engineer status.

RBAC: `farmer` | `engineer` | `admin`. Field access scoped by `farmer_id`.

---

## 8. Crop ML plan

- **Dataset:** public Crop Recommendation CSV (N, P, K, temperature, humidity, pH, rainfall → `label`). Typical published size ~2200 rows, 22 classes. License recorded in `12_CROP_DATASET.md` after the file is vendored.
- **Model:** Random Forest classifier (interpretable feature importances; fits small tabular data).
- **Split:** stratified 80/20, metrics on held-out test only.
- **Do not** add previous_crop, market, area, or preference to the model.
- **Never display a hardcoded accuracy.** Persist metrics in `model_versions`.
- If training data is missing, crop analysis still runs on **rules only** and labels ML as unavailable.

---

## 9. Crop analysis plan

```
Field context (GPS, season, soil sources, water, previous crop, climate, optional market)
        ↓
ML probabilities (if model loaded) → mapped to 0–100
        ↓
Rule adjustments (rotation family, water constraint, season, farmer preference, market if fresh)
        ↓
Ranked list + positive/negative factors + warnings + sources + model_version + rule_version
```

Rule version: `crop-analysis-rules-v1`. No absolute ban such as “previous = tomato ⇒ tomato forbidden”.

---

## 10. IoT plan

- Device belongs to exactly one field.
- Ingest `POST /api/v1/sensor/readings` with device auth.
- Heartbeat `last_seen_at`.
- Commands: farmer confirms decision → safety engine → store command with expiry and idempotency key → device **polls** `GET /api/v1/devices/{id}/commands` (simpler than inbound ESP32 TCP for hackathon).
- Actuator: LED + relay/servo on safe voltage.
- ESP32-CAM: optional later; snapshots only, no disease claims.

---

## 11. Irrigation plan

Deterministic engine `irrigation-engine-v1`:

Inputs: fresh soil moisture (sensor health gated), T/H, forecast precipitation probability, crop stage demand, recent irrigation, water availability, ET0 if present, simulation overlay.

Outputs: `IRRIGATE` | `DELAY` | `DO_NOT_IRRIGATE` plus estimated litres (`ESTIMATED`), duration from calibrated flow or `FLOW_UNCALIBRATED`, reason codes, confidence, data quality.

Stale/invalid sensor → reduced confidence and **no auto-execute**.

Water: litres = depth_mm × area_m² × application_efficiency_factor (documented assumption, not FAO-validated for this deployment).

---

## 12. AI agent plan

- Tools are backend Python functions with the same auth as HTTP.
- LLM never computes irrigation litres or suitability scores.
- If LLM unavailable: intent keywords (Telugu + English) + same tools + template explanation (`AI_EXPLANATION` not claimed if templates used — category `ENGINE_DECISION` + templated copy).
- Prompt injection cannot grant field access; tools bind `farmer_id` from JWT, not from model text.

---

## 13. Voice plan

1. Browser Web Speech Recognition (te-IN / en-IN / mixed).
2. Same `/ai/chat` pipeline.
3. SpeechSynthesis for reply.
4. Optional Groq Whisper if browser STT fails and audio blob is uploaded.
5. “Turn on irrigation” → confirmation card, never immediate GPIO.

---

## 14. Security plan

- Password hashing (bcrypt), JWT expiry.
- Farmer cannot read another farmer’s fields (integration tests).
- Device token ≠ user token.
- Execute path: user + farm + field + device + decision_id + unexpired confirmation + safety checks.
- Rate limit auth and AI routes.
- Audit log for commands and tool calls.
- LLM output is never an authorization token.

---

## 15. Testing plan

Priority tests (must exist before claiming the pipeline works):

- Irrigation rain-override, stale sensor, invalid moisture
- Water litres formula
- Crop rotation adjustments (soft, not absolute)
- Field isolation (farmer A vs B)
- Command expiry and duplicate idempotency
- Weather provider failure → `WEATHER_DATA_UNAVAILABLE`
- Simulation does not enqueue actuator commands

---

## 16. Deployment plan

Hackathon: single machine.

```
uvicorn backend.app.main:app --reload --port 8000
npm run dev  (frontend :5173, proxy /api)
ESP32 → laptop IP on local Wi-Fi
```

`.env` for secrets. Never commit keys. Optional Docker Compose later (Postgres + API). No cloud required for judging.

---

## 17. Updated implementation roadmap

| Phase | Name | Hackathon gate |
| --- | --- | --- |
| 0 | Docs + inspection | This folder |
| 1–3 | DB + API + farmer/farm/field | Required |
| 4 | Field map (Leaflet) | Required |
| 5–7 | Soil, weather, previous crop | Required |
| 8–11 | Dataset, RF model, analysis engine, UI | Required (criterion 1) |
| 12–16 | Telemetry, health, irrigation, explain, history | Required (criterion 2) |
| 17–18 | Safety, actuator | Required (criterion 3) |
| 19 | Alerts | Required for dashboard |
| 20–23 | Agent, LLM, RAG lite, voice | Required if keys/browser allow; templates otherwise |
| 24–25 | Simulation + traces | Required wow-moment |
| 26–29 | CAM, market, advanced ML, offline | Optional / labeled unavailable |

**Stop rule:** do not start phase N+1 if phase N core tests fail.

---

## Architectural non-negotiables (frozen)

1. Field is the operational unit.  
2. Source labels on important values.  
3. Real fresh sensors beat estimates for *current* conditions; forecasts still used for *future* rain.  
4. LLM is not the decision engine.  
5. Deterministic engines for crop analysis fusion, irrigation, sensor health, safety, water math.  
6. Auditable decision IDs.

---

## Next step after this document set

Implement phases 1–3 (domain + API + auth + seed demo farmer/field), then weather/soil, then crop analysis, then irrigation, then UI/voice/simulation.
