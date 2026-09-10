# 18 — Water Calculation

## Purpose

Convert a recommended irrigation depth into litres and pump duration without hardcoded “run 90 seconds”.

## Scope

Estimates. Actual litres only from flow sensor or calibrated tank drop.

## Architecture

```
litres = depth_mm * area_m2 * 1.0 * method_factor
duration_min = litres / flow_lpm   if flow calibrated
else duration unknown / duty-cycle default labeled FLOW_UNCALIBRATED
```

`1 mm` over `1 m²` = `1 litre`.

## Inputs

Field area_m2, recommended depth_mm from profile/stage (assumption table), irrigation method factor (drip 0.9, sprinkler 0.75, furrow 0.6 — **assumptions**), pump_flow_lpm if calibrated.

## Outputs

`estimated_water_litres` source ESTIMATED. `actual_water_litres` source REAL_SENSOR if flow pulses exist.

## Data Flow

Engine → UI distinguishes ESTIMATED vs ACTUAL. History stores both.

## Dependencies

Field area from polygon or farmer entry (source labeled).

## Failure Cases

Area missing: cannot compute litres; return `AREA_UNKNOWN`. Uncalibrated pump: estimate litres, duration from conservative max runtime cap for safety (e.g. 30s LED demo / 120s small pump) with labels.

## Security

Max duration cap always applied before GPIO.

## MVP Implementation

Demo field small area (e.g. 4 m² plot or mapped field). Depth 5 mm default vegetative unless profile says otherwise.

## Production Extension

Flow meter, pressure, uniformity tests.

## Testing

1 mm × 10 m² = 10 L. Method factor applied.

## Limitations

Not a validated crop water requirement study. Do not cite as scientific ET.
