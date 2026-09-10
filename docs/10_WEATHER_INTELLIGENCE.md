# 10 — Weather Intelligence

## Purpose

Field-specific current weather and forecast from a real API.

## Scope

Temperature, humidity, precipitation, precipitation probability, wind, weather code, ET0 when offered by API.

## Architecture

`WeatherProvider` protocol; `OpenMeteoWeatherProvider` implementation.

Endpoint (verified): `https://api.open-meteo.com/v1/forecast`  
Params: latitude, longitude from **field**; current + hourly + daily; `et0_fao_evapotranspiration` on daily if available; `precipitation_probability`.

Store: provider, lat, lon, retrieved_at, forecast_time, variables, quality.

Source label: `WEATHER_API`.

## Inputs

Field coordinates. Timezone `Asia/Kolkata`.

## Outputs

Normalized schema for engines and UI. Attribution: Open-Meteo, CC BY 4.0.

## Data Flow

Cache ~15 minutes per field. Irrigation and crop analysis call WeatherService, not the LLM.

## Dependencies

Network; 10k calls/day non-commercial free tier — cache aggressively.

## Failure Cases

Timeout/HTTP error → `WEATHER_DATA_UNAVAILABLE`. **Do not reuse another field’s weather. Do not invent values.** Irrigation: proceed only with sensors + history; lower confidence; reason `WEATHER_UNAVAILABLE`.

## Security

No user PII sent; only coordinates.

## MVP Implementation

httpx GET; Pydantic parse; persist last success for display with `retrieved_at` (stale forecast labeled if >3h).

## Production Extension

Paid Open-Meteo customer API if commercial; IMD if licensed.

## Testing

Mock 503; assert error code. Mock payload maps rain probability to engine.

## Limitations

Model grid is not microclimate. Probability is forecast, not a guarantee of rain.
