# 09 — Soil Intelligence

## Purpose

`SoilService` supplies soil context with honest provenance.

## Scope

pH, N, P, K, texture, optional OC/sand/silt/clay. Lab vs background estimate.

## Architecture

```
SoilProvider (protocol)
  FarmerSoilProvider     → FARMER_INPUT / ACTUAL SOIL TEST
  SoilGridsProvider      → ESTIMATED (if API up)
  LocalDatasetProvider   → ESTIMATED / HISTORICAL
```

`SoilService.get_field_soil(field)` merges: prefer `is_lab_test` or farmer observation for nutrients used in ML **if present**; else use estimated layers and label them; else `SOIL_DATA_UNAVAILABLE`.

## Inputs

Field lat/lon; optional observation payload.

## Outputs

Profile with per-metric source. Flag `presentation: "LAB" | "BACKGROUND_ESTIMATE" | "UNAVAILABLE"`.

## Data Flow

Crop analysis reads SoilService; never raw SoilGrids numbers labeled as tests.

## Dependencies

Doc 44: SoilGrids REST may be paused. Timeout 8s. Cache 24h by lat/lon grid.

## Failure Cases

SoilGrids 5xx/pause → estimated remote unavailable; farmer values still used. Incomplete NPK: ML features missing → crop analysis uses rules + climate only and lists `ML_FEATURES_INCOMPLETE`.

## Security

Observations scoped to field ACL.

## MVP Implementation

Demo: farmer-entered pH/NPK. Attempt SoilGrids; on fail show banner. Do not fill NPK from weather.

## Production Extension

NBSS/local Andhra soil maps; sample lab CSV import.

## Testing

Merge preference test; unavailable path.

## Limitations

SoilGrids is global modelled soil, coarse vs field heterogeneity. NPK in Kaggle units may not match SoilGrids units — **do not auto-map units without a documented conversion**. If conversion unknown, do not feed SoilGrids into the RF model.
