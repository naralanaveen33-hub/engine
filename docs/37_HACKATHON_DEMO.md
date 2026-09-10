# 37 — Hackathon Demo

## Purpose

17-step judging script that is physically reproducible indoors.

## Scope

REAL: ESP32, soil sensor, T/H, actuator, configured GPS. EXTERNAL: Open-Meteo. SIMULATED: future weather scenarios only, labeled.

## Architecture

Demo mode flag `HACKATHON_DEMO=true` seeds farm/field and eases CORS; **does not fake weather or accuracy**.

## Inputs

Hardware on table; phone/laptop UI.

## Outputs

Narrative below.

## Data Flow

Follow success criteria 1–3.

## Dependencies

Working phases 1–24 core.

## Failure Cases

If sensor dry not possible, show real reading + engineer view; still run rain simulation wow-moment. If no Groq, Telugu **text** still works.

## Security

Confirm tap visible to judges.

## MVP Implementation

### Script

1. Open AquaCrop — farm, field, boundary, area, GPS.  
2. Crop tomato flowering; previous groundnut (farmer entered).  
3. Live ESP32 moisture/T/H.  
4. Real rain probability from API.  
5. Crop analysis ranking + why.  
6. Irrigation evaluate.  
7. WHY panel (moisture, rain, stage, history).  
8. Telugu question.  
9. Telugu explanation with source tags.  
10. Ask to start irrigation.  
11. Farmer yes (confirm).  
12. Safety checks visible in engineer pane.  
13. ESP32 command.  
14. LED/relay ON.  
15. Dashboard IRRIGATING.  
16. History chain.  
17. SIMULATION HEAVY_RAIN → DELAY. Banner on.

## Production Extension

N/A.

## Testing

Dry-run twice before judging.

## Limitations

Indoor GPS is configured coordinates, labeled FARMER_INPUT or map pin, not GNSS live unless phone geolocation used (source GPS).
