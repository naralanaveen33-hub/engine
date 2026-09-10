# 31 — Frontend Specification

## Purpose

Farmer-simple UI plus engineer depth.

## Scope

React SPA. Farmer mode default. CTA: ASK AQUACROP. Secondary: ANALYZE CROP, EVALUATE IRRIGATION, START SIMULATION, VIEW HISTORY.

## Architecture

Pages: Login, Farm overview, Field map, Field detail, Crop analysis, Irrigation, History, Alerts, Assistant, Engineer status. Leaflet map.

## Inputs

API JSON with source tags → `<SourceTag source="REAL_SENSOR" />`.

## Outputs

Field cards: name, crop, stage, previous crop, soil, moisture, T, H, weather, suitability, irrigation status, device status.

Crop analysis screen per prompt section 45.

Simulation banner always visible in sim mode.

## Data Flow

React Query-like fetch (or simple hooks). Voice component on home.

## Dependencies

Leaflet OSM tiles (attribution required).

## Failure Cases

Empty states: “Weather unavailable”. No skeleton fake charts with dummy rain.

## Security

Store JWT in memory + sessionStorage. Engineer route role-gated.

## MVP Implementation

CSS without heavy UI kits if faster; accessible buttons; Telugu font (Noto Sans Telugu).

## Production Extension

PWA, maps offline tiles.

## Testing

Manual demo; source tags visible on field card.

## Limitations

Not fully responsive-polished for every device in 24h — target laptop + phone width.
