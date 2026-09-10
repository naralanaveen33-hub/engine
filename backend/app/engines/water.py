METHOD_FACTOR = {"DRIP": 0.9, "SPRINKLER": 0.75, "FURROW": 0.6, "FLOOD": 1.0, "MANUAL": 0.8}


def litres_for_depth(depth_mm: float, area_m2: float, method: str) -> float:
    factor = METHOD_FACTOR.get(method.upper(), 0.85)
    return depth_mm * area_m2 * factor


def duration_seconds(litres: float, flow_lpm: float | None, max_seconds: int) -> tuple[float | None, str]:
    if flow_lpm is None or flow_lpm <= 0:
        capped = min(max_seconds, 15)
        return float(capped), "FLOW_UNCALIBRATED"
    minutes = litres / flow_lpm
    sec = minutes * 60
    if sec > max_seconds:
        return float(max_seconds), "DURATION_CAPPED_SAFETY"
    return float(sec), "CALCULATED_FROM_FLOW"
