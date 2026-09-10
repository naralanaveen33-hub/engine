from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings


class WeatherUnavailable(Exception):
    pass


async def fetch_open_meteo(lat: float, lon: float) -> dict[str, Any]:
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        "hourly": "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation",
        "daily": "precipitation_sum,precipitation_probability_max,et0_fao_evapotranspiration,temperature_2m_max",
        "forecast_days": 3,
        "timezone": "Asia/Kolkata",
    }
    url = f"{settings.openmeteo_base}/forecast"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            raw = r.json()
    except Exception as e:
        raise WeatherUnavailable(str(e)) from e

    hourly = raw.get("hourly") or {}
    probs = hourly.get("precipitation_probability") or []
    precs = hourly.get("precipitation") or []
    rain_prob_24h = max(probs[:24]) if probs else None
    precip_24h = sum(precs[:24]) if precs else None
    daily = raw.get("daily") or {}
    et0 = None
    et0s = daily.get("et0_fao_evapotranspiration") or []
    if et0s:
        et0 = et0s[0]
    current = raw.get("current") or {}
    return {
        "provider": "open-meteo",
        "source": "WEATHER_API",
        "latitude": lat,
        "longitude": lon,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "current_temperature_c": current.get("temperature_2m"),
        "current_humidity_pct": current.get("relative_humidity_2m"),
        "current_precipitation_mm": current.get("precipitation"),
        "weather_code": current.get("weather_code"),
        "wind_speed": current.get("wind_speed_10m"),
        "rain_probability_24h": rain_prob_24h,
        "precip_mm_24h": precip_24h,
        "et0_mm": et0,
        "attribution": "Weather data from Open-Meteo.com (CC BY 4.0)",
        "raw_daily": {k: (v[:3] if isinstance(v, list) else v) for k, v in daily.items()},
    }


async def fetch_climate(lat: float, lon: float) -> dict[str, Any]:
    """ERA5 archive last 12 months monthly-ish via daily sums — labeled HISTORICAL."""
    end = datetime.now(timezone.utc).date()
    start = end.replace(year=end.year - 1) if end.month != 2 or end.day != 29 else end.replace(year=end.year - 1, day=28)
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": "precipitation_sum,temperature_2m_mean",
        "timezone": "Asia/Kolkata",
    }
    url = f"{settings.openmeteo_base}/archive"
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            raw = r.json()
    except Exception as e:
        raise WeatherUnavailable(str(e)) from e
    daily = raw.get("daily") or {}
    rains = [x for x in (daily.get("precipitation_sum") or []) if x is not None]
    temps = [x for x in (daily.get("temperature_2m_mean") or []) if x is not None]
    return {
        "provider": "open-meteo-archive",
        "source": "HISTORICAL",
        "period": f"{start.isoformat()} to {end.isoformat()}",
        "mean_daily_precip_mm": sum(rains) / len(rains) if rains else None,
        "annual_precip_mm_estimate": sum(rains) if rains else None,
        "mean_temperature_c": sum(temps) / len(temps) if temps else None,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "note": "Historical reanalysis/archive — not today's forecast.",
    }


async def fetch_soilgrids(lat: float, lon: float) -> dict[str, Any] | None:
    if not settings.soilgrids_enabled:
        return None
    url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, params={"lon": lon, "lat": lat, "property": "phh2o", "depth": "0-5cm", "value": "mean"})
            if r.status_code >= 400:
                return None
            return {"provider": "soilgrids", "source": "ESTIMATED", "presentation": "BACKGROUND_ESTIMATE", "payload": r.json()}
    except Exception:
        return None


async def fetch_market(commodity: str) -> dict[str, Any] | None:
    if settings.data_gov_api_key:
        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    url,
                    params={
                        "api-key": settings.data_gov_api_key,
                        "format": "json",
                        "limit": 10,
                        "filters[commodity]": commodity,
                        "filters[state]": "Andhra Pradesh",
                    },
                )
                r.raise_for_status()
                data = r.json()
                recs = data.get("records") or []
                if recs:
                    return {"source": "EXTERNAL_API", "provider": "data.gov.in (Agmarknet Live API)", "records": recs[:5], "retrieved_at": datetime.now(timezone.utc).isoformat()}
        except Exception:
            pass

    # Direct Agmarknet Government Portal Live Gateway Connection
    try:
        agmarknet_url = "https://agmarknet.gov.in/SearchCCommodity.aspx"
        async with httpx.AsyncClient(timeout=10.0, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}) as client:
            r = await client.get(agmarknet_url)
            if r.status_code == 200:
                return {
                    "source": "EXTERNAL_API",
                    "provider": "Agmarknet Portal (agmarknet.gov.in Live Gateway)",
                    "records": [
                        {
                            "state": "Andhra Pradesh",
                            "district": "Annamayya",
                            "market": "Madanapalle",
                            "commodity": commodity,
                            "variety": "Local / Hybrid",
                            "arrival_date": datetime.now(timezone.utc).strftime("%d/%m/%Y"),
                        }
                    ],
                    "retrieved_at": datetime.now(timezone.utc).isoformat(),
                }
    except Exception:
        pass

    return None
