# 11 — Crop Management

## Purpose

Crops as reference data plus per-field current and mixed plantings.

## Scope

Catalog, growth stages, planting date, duration, irrigation method, single and mixed fractions.

## Architecture

`crops` + `crop_profiles` (rule data) vs `field_crops` (instance). Stages: GERMINATION, VEGETATIVE, FLOWERING, FRUITING, MATURITY.

## Inputs

Farmer selection; analysis recommendation (does not auto-plant).

## Outputs

Current crop card; mixed: Tomato 60% + Chilli 40%.

## Data Flow

Irrigation uses current `field_crops` stage for demand multipliers. Analysis uses catalog + history, not only current crop.

## Dependencies

Rotation (15), mixed (16), profiles used by irrigation (17).

## Failure Cases

Unknown crop code rejected. Mixed fractions must sum to 100% ± 0.5.

## Security

Field-scoped writes.

## MVP Implementation

Seed Andhra-relevant catalog: rice, maize, groundnut, chilli, tomato, cotton, sugarcane, blackgram, greengram, mango (perennial flagged), etc. matching ML labels where possible (`chickpea`, `kidneybeans`, … mapped). Crops in catalog but not in ML still appear via rules.

## Production Extension

Variety-level profiles; ICAR stage lengths.

## Testing

Fraction validation; stage enum.

## Limitations

Stage is farmer-entered unless later computed from planting date heuristics (heuristic must be labeled `ESTIMATED`).
