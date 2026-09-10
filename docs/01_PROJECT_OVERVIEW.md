# 01 — Project Overview

## Purpose

Define AquaCrop as a location-aware agricultural decision platform for the 24-hour Swarnandhra College Hackathon 2026: understand a **field**, recommend crops honestly, decide irrigation explainably, speak Telugu or English, obtain confirmation, then actuate hardware only through safety and authorization.

## Scope

**In scope (MVP):** farmer/farm/field hierarchy, map, field GPS weather, soil with source labels, previous crop, crop analysis (ML + rules), ESP32 moisture/T/H, irrigation engine, explanations, confirmation, safe actuator, history, simulation mode, farmer + engineer UI, optional LLM/voice.

**Out of scope (unless proven):** disease detection, scientifically validated FAO AquaCrop clone, guaranteed profit/yield, commercial-grade offline mesh, multi-tenant SaaS billing.

## Architecture

See `03_SYSTEM_ARCHITECTURE.md`. Layers: UI/Voice → API → services/engines → providers → DB/devices.

## Inputs

Farmer identity, field geometry and GPS, previous crop (or explicit unknown), soil observations, live sensors, Open-Meteo weather, optional market, optional voice/text.

## Outputs

Ranked crop suitability (not yield), irrigation recommendation (`IRRIGATE` / `DELAY` / `DO_NOT_IRRIGATE`), explanations, alerts, authorized commands, irrigation history, engineer traces.

## Data Flow

Real farm data → field context → validation → crop analysis and/or irrigation engine → explanation → confirmation → safety → ESP32 → history.

## Dependencies

Python FastAPI stack, React/Vite, Open-Meteo, SQLite, ESP32 hardware, optional Groq and data.gov.in.

## Failure Cases

Missing GPS, weather down, soil provider down, stale sensors, LLM down, device offline. Surfaces explicit unavailable states; never fabricates.

## Security

JWT + field ACL + device tokens + command authorization. LLM untrusted.

## MVP Implementation

Single-laptop demo with one seeded Andhra Pradesh field, real weather, farmer-entered soil and previous crop, trained RF if dataset present, physical LED/relay.

## Production Extension

PostgreSQL, stronger device identity (mTLS), calibrated flow meters, agronomist-reviewed rules, regional crop datasets, offline command queues.

## Testing

End-to-end demo script in `37_HACKATHON_DEMO.md`; automated tests in `35_TESTING_STRATEGY.md`.

## Limitations

Hackathon models are not nationally validated. Water volumes are estimates unless a flow sensor is calibrated. SoilGrids (if used) is not a lab test.
