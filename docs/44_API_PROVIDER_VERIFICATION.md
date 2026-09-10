# 44 — API Provider Verification

**Verified:** 2026-09-10 (web documentation). Re-check if a provider fails on demo day.

## Purpose

Do not assume APIs exist. Record current auth, limits, license, regional notes.

## Scope

Providers we intend to call.

## Architecture

Each adapter documents fail-closed behavior.

## Inputs

Public docs.

## Outputs

Table below.

## Data Flow

Adapters implement only verified endpoints.

## Dependencies

Network.

## Failure Cases

If docs change, disable adapter.

## Security

Keys in env.

## MVP Implementation

### Open-Meteo Forecast

- Docs: https://open-meteo.com/en/docs  
- URL: `https://api.open-meteo.com/v1/forecast`  
- Auth: none for non-commercial  
- License: CC BY 4.0 attribution required  
- Limits (published): ~10,000 calls/day, 5,000/hour, 600/min (fair use / free non-commercial)  
- Variables: temperature, humidity, precipitation, precipitation_probability, wind, weathercode, daily `et0_fao_evapotranspiration`  
- Regional: global, includes India  
- **Use:** primary weather  

### Open-Meteo Historical / Archive

- Docs: https://open-meteo.com/en/docs/historical-weather-api  
- URL: `https://api.open-meteo.com/v1/archive`  
- Auth: none non-commercial  
- Use: ClimateService seasonal rainfall/temperature (`HISTORICAL`)  
- Do not label as current weather  

### ISRIC SoilGrids REST v2

- Docs: https://rest.isric.org/soilgrids/v2.0/docs  
- URL: `https://rest.isric.org/soilgrids/v2.0/properties/query`  
- Auth: none  
- Fair use: 5 calls / minute  
- **Status 2026:** official SoilGrids docs state REST API issues / pause — **must handle UNAVAILABLE**  
- License: ISRIC data policy; cite SoilGrids if used  
- **Never present as lab test**  
- Unit mismatch with Kaggle NPK: do not pipe into RF without conversion  

### data.gov.in Agmarknet daily prices

- Resource id commonly used: `9ef84268-d588-465a-a308-a864a43d0070`  
- URL: `https://api.data.gov.in/resource/{id}`  
- Auth: `api-key` from https://data.gov.in account  
- Pricing: free key; portal reliability variable  
- **If no key: MARKET_DATA_UNAVAILABLE**  
- Does not justify profit claims  

### Groq (LLM + optional Whisper)

- API: OpenAI-compatible `https://api.groq.com/openai/v1`  
- Auth: Bearer API key, free tier no credit card (verify console)  
- Limits: model-specific RPM/TPM/RPD (commonly ~30 RPM on free); 429 + Retry-After  
- Whisper models for STT if used  
- Telugu quality: test; fallback templates  
- **If no key: agent still works via rules/templates**  

### Leaflet / OSM tiles

- Maps: OpenStreetMap tile usage policy; attribution required  
- No Google Maps key  

### Browser Web Speech API

- Auth: none  
- Regional: te-IN availability depends on OS/browser  

## Production Extension

Paid Open-Meteo; IMD licensed data; local soil labs.

## Testing

Live smoke optional `pytest -m network`.

## Limitations

Verification is point-in-time. SoilGrids pause is a known demo risk — farmer soil entry is the reliable path.
