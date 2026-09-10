# 16 — Mixed Cropping

## Purpose

Allow single (100%) or mixed area fractions with a **simplified** compatibility model.

## Scope

Store fractions; score pairwise compatibility; do not claim optimization of spacing/root-zone science beyond encoded table.

## Architecture

`mixed_group_id` on `field_crops`. `CompatibilityService` table: good / caution / poor.

## Inputs

List of {crop_id, percent}.

## Outputs

Validation errors if sum ≠ 100. Warnings for poor pairs (e.g. conflicting irrigation: rice flood vs chilli). Irrigation engine uses **max demand** among mixed crops (conservative) and reason `MIXED_CROP_MAX_DEMAND`.

## Data Flow

Analysis can suggest companions as warnings only.

## Dependencies

Crop profiles irrigation class: FLOOD, FURROW, DRIP, SPRINKLER.

## Failure Cases

Incompatible irrigation classes → constraint, not silent average.

## Security

Field ACL.

## MVP Implementation

Small matrix for tomato–chilli (often compatible, caution disease), rice–groundnut (poor water regime). Default unknown pair = caution.

## Production Extension

Spacing and duration overlap optimizer — not in MVP.

## Testing

60/40 valid; 60/50 invalid.

## Limitations

Simplified compatibility ≠ agronomic design.
