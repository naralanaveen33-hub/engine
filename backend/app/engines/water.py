"""
AquaCrop Water Requirement & Irrigation Duration Engine
Calculates NET crop root-zone requirement vs GROSS application depth accounting for system efficiency.
"""
from typing import Any

METHOD_EFFICIENCY = {
    "DRIP": 0.90,       # 90% efficiency (10% loss)
    "SPRINKLER": 0.75,  # 75% efficiency (25% loss)
    "FURROW": 0.60,     # 60% efficiency
    "FLOOD": 0.50,      # 50% efficiency
    "MANUAL": 0.80,     # 80% efficiency
}


def litres_for_depth(depth_mm: float, area_m2: float, method: str) -> float:
    """Legacy helper: Returns gross water requirement in litres."""
    req = calculate_water_requirement(depth_mm, area_m2, method)
    return req["gross_water_litres"]


def calculate_water_requirement(net_depth_mm: float, area_m2: float, method: str) -> dict[str, Any]:
    """
    Calculates NET water volume vs GROSS application volume.
    Net depth (mm) over area (m²) is 1 mm * 1 m² = 1 Litre.
    Gross water (Litres) = Net water (Litres) / Efficiency Factor.
    """
    net_water_litres = net_depth_mm * area_m2
    efficiency = METHOD_EFFICIENCY.get(method.upper(), 0.85)
    gross_water_litres = net_water_litres / efficiency if efficiency > 0 else net_water_litres

    return {
        "net_depth_mm": round(net_depth_mm, 2),
        "area_m2": round(area_m2, 2),
        "net_water_litres": round(net_water_litres, 2),
        "method": method.upper(),
        "efficiency": efficiency,
        "gross_water_litres": round(gross_water_litres, 2),
    }


def duration_seconds(litres: float, flow_lpm: float | None, max_seconds: int) -> tuple[float | None, str]:
    """Legacy helper returning (safe_seconds, status_code)."""
    res = calculate_irrigation_duration(litres, flow_lpm, max_seconds)
    return res["safe_execution_duration_seconds"], res["duration_status"]


def calculate_irrigation_duration(
    gross_water_litres: float,
    flow_lpm: float | None,
    max_allowed_seconds: int = 7200,
) -> dict[str, Any]:
    """
    Calculates raw calculated duration vs safe executable duration.
    Safety engine caps execution at max_allowed_seconds.
    """
    if flow_lpm is None or flow_lpm <= 0:
        capped_safe = float(min(max_allowed_seconds, 15))
        return {
            "water_litres": round(gross_water_litres, 2),
            "flow_rate_lpm": None,
            "calculated_duration_seconds": None,
            "calculated_duration_minutes": None,
            "max_allowed_duration_seconds": max_allowed_seconds,
            "max_allowed_duration_minutes": round(max_allowed_seconds / 60.0, 2),
            "safe_execution_duration_seconds": capped_safe,
            "safe_execution_duration_minutes": round(capped_safe / 60.0, 2),
            "duration_status": "FLOW_UNCALIBRATED",
        }

    calc_minutes = gross_water_litres / flow_lpm
    calc_seconds = calc_minutes * 60.0

    if calc_seconds > max_allowed_seconds:
        safe_seconds = float(max_allowed_seconds)
        status = "DURATION_CAPPED_SAFETY"
    else:
        safe_seconds = calc_seconds
        status = "EXACT_CALCULATED"

    return {
        "water_litres": round(gross_water_litres, 2),
        "flow_rate_lpm": flow_lpm,
        "calculated_duration_seconds": round(calc_seconds, 1),
        "calculated_duration_minutes": round(calc_minutes, 2),
        "max_allowed_duration_seconds": max_allowed_seconds,
        "max_allowed_duration_minutes": round(max_allowed_seconds / 60.0, 2),
        "safe_execution_duration_seconds": round(safe_seconds, 1),
        "safe_execution_duration_minutes": round(safe_seconds / 60.0, 2),
        "duration_status": status,
    }
