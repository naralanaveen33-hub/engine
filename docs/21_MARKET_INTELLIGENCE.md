# 21 — Market Intelligence

## Purpose

Optional signal for **crop selection only**. Never irrigation.

## Scope

Price, freshness, market name. No “this will profit”.

## Architecture

`MarketProvider` → `MarketIntelligenceService`.

Verified path: data.gov.in resource `9ef84268-d588-465a-a308-a864a43d0070` (daily mandi prices) **requires API key**.

## Inputs

Crop commodity mapping, state (Andhra Pradesh), optional district.

## Outputs

`price` + `retrieved_at` + `stale` + source `EXTERNAL_API`. If no key or error: `MARKET_DATA_UNAVAILABLE`.

## Data Flow

Crop analysis may add small score delta if data age < 7 days. Irrigation ignores market.

## Dependencies

`DATA_GOV_API_KEY` env. Unreliable portal possible.

## Failure Cases

Key missing, HTTP fail, empty records, commodity unmapped → unavailable. Do not interpolate fake prices.

## Security

API key server-side only.

## MVP Implementation

If key absent, UI: market section hidden or “unavailable”. Mapping table chilli/tomato/groundnut/maize.

## Production Extension

Time-series trend; nearest mandi geocode.

## Testing

Mock empty records.

## Limitations

Mandi price ≠ farmgate profit. Arrival volume often missing.
