# 36 — Deployment

## Purpose

Run the hackathon demo on one laptop plus ESP32.

## Scope

Dev servers. Optional Docker later.

## Architecture

Frontend :5173 proxies `/api` → FastAPI :8000. ESP32 uses laptop LAN IP.

## Inputs

`.env.example` copied to `.env`.

## Outputs

Running system.

## Data Flow

N/A.

## Dependencies

Python 3.11, Node 20+, Wi-Fi.

## Failure Cases

Firewall blocking 8000; ESP32 wrong IP; Open-Meteo blocked — show unavailable.

## Security

Do not expose 8000 to WAN without auth review. Change demo password.

## MVP Implementation

```
cd backend && python -m venv .venv && pip install -r requirements.txt
python -m ml.train  # if dataset present
uvicorn app.main:app --host 0.0.0.0 --port 8000
cd frontend && npm i && npm run dev
```

Seed credentials documented in README after implementation (not default admin/admin if we can avoid).

## Production Extension

Compose: postgres, api, nginx, TLS.

## Testing

Health GET `/health`.

## Limitations

Not cloud HA.
