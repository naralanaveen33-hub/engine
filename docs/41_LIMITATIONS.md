# 41 — Limitations

## Purpose

Central honesty list for judges and farmers.

## Scope

Product-wide.

## Architecture

UI may link “How reliable is this?” to this content (short form).

## Inputs

N/A.

## Outputs

Limitations:

- RF is educational-dataset classification, not local yield science.  
- Irrigation thresholds are v1 engineering defaults.  
- Water litres estimated without flow meter.  
- SoilGrids (if any) is not a lab test; API may be down.  
- Weather is grid forecast, not field microclimate.  
- Market price ≠ profit.  
- No disease detection.  
- Voice STT imperfect.  
- SQLite single node.  
- Simulation is overlay, not a climate model.  
- Field status score (if shown) is not crop-health science.

## Data Flow

N/A.

## Dependencies

N/A.

## Failure Cases

N/A.

## Security

N/A.

## MVP Implementation

Footer on crop and irrigation screens.

## Production Extension

Replace defaults with validated local trials.

## Testing

Copy review.

## Limitations

This document cannot list unknown unknowns.
