# 32 — Backend Specification

## Purpose

Python FastAPI layout and coding rules.

## Scope

Monolith package `backend/app`.

## Architecture

```
api/routers/*  → services/* → engines/* | providers/*
                    ↓
              repositories/* → models
```

No business math in routers. No SQL in engines.

## Inputs

Settings via pydantic-settings `.env`.

## Outputs

OpenAPI at `/docs`.

## Data Flow

Unit of work: session per request.

## Dependencies

Python 3.11+, listed in requirements.txt.

## Failure Cases

Startup without ML file: warn, continue. Without OPENMETEO network: weather calls fail per-request.

## Security

Settings secrets not logged.

## MVP Implementation

`main.py` includes routers, CORS, create_all, seed if empty.

## Production Extension

Alembic migrations required; gunicorn workers.

## Testing

pytest from `backend/tests`.

## Limitations

Single worker recommended with SQLite.
