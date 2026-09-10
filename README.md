# AquaCrop

Location-aware crop analysis and irrigation intelligence for the 2026 Swarnandhra College hackathon.

This repository was **greenfield** (empty except an unused Obsidian vault in `aqce/`). Design docs are in [`docs/`](docs/README.md). Inspection notes: [`docs/00_REPOSITORY_ANALYSIS.md`](docs/00_REPOSITORY_ANALYSIS.md).

## Principles (enforced in code)

- Field is the operational unit.
- Every important value has a `source` (REAL_SENSOR, WEATHER_API, FARMER_INPUT, ESTIMATED, MODEL_OUTPUT, SIMULATION, …).
- Irrigation and crop ranking are **deterministic engines**, not the LLM.
- Farmer confirmation + safety before any actuator command.
- Missing APIs surface as unavailable — they are not invented.

## Run (Windows)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# optional: place ml/data/crop_recommendation.csv then from repo root:
#   python -m ml.train
# (run train with PYTHONPATH or from repo: python ml/train.py)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Demo accounts

| Email | Password | Role |
| --- | --- | --- |
| demo@aquacrop.local | demo1234 | farmer |
| engineer@aquacrop.local | demo1234 | engineer |

Seeded field: Tomato Field 1 near Narsapur / Swarnandhra (configured GPS, `FARMER_INPUT`). Previous crop: groundnut (`FARMER_INPUT`). Device token: `esp32-demo-token`, hardware id `esp32-demo-01`.

### Virtual ESP32 (no hardware)

```powershell
cd backend
python simulate_device.py
```

Set `MOISTURE=18` for a dry reading. Flash `firmware/esp32/aquacrop_node.ino` for a physical board (LED/relay only, never mains on GPIO).

### Tests

```powershell
cd backend
pytest -q
```

## Weather

Open-Meteo, field lat/lon, CC BY 4.0 attribution in API payloads. If the network fails the API returns `WEATHER_DATA_UNAVAILABLE`.

## ML

Without `ml/data/crop_recommendation.csv` the Random Forest is **UNAVAILABLE** and crop analysis uses rules only. Never displays a hardcoded accuracy.
