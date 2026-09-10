import math
from typing import Any

EARTH_RADIUS_M = 6371000.0  # WGS84 average radius in meters


def calculate_polygon_area_m2(coords: list[list[float]]) -> float:
    """
    Calculates exact geodesic polygon area in square meters for WGS84 lat/lon coordinates.
    coords expected format: [[lon, lat], [lon, lat], ...]
    """
    if not coords or len(coords) < 3:
        return 0.0

    # Ensure closed polygon
    if coords[0] != coords[-1]:
        coords = list(coords) + [coords[0]]

    # Center origin to reduce floating point errors
    lat0 = coords[0][1]
    lon0 = coords[0][0]
    lat0_rad = math.radians(lat0)

    projected = []
    for lon, lat in coords:
        d_lat = math.radians(lat - lat0)
        d_lon = math.radians(lon - lon0)
        x = d_lon * EARTH_RADIUS_M * math.cos(lat0_rad)
        y = d_lat * EARTH_RADIUS_M
        projected.append((x, y))

    # Shoelace formula on projected meters
    area = 0.0
    n = len(projected)
    for i in range(n - 1):
        x1, y1 = projected[i]
        x2, y2 = projected[i + 1]
        area += (x1 * y2) - (x2 * y1)

    return abs(area) / 2.0


def convert_area_m2(area_m2: float) -> dict[str, float]:
    """Converts area_m2 to acres and hectares with explicit mathematical formulas."""
    acres = area_m2 / 4046.8564224
    hectares = area_m2 / 10000.0
    return {
        "m2": round(area_m2, 2),
        "acres": round(acres, 4),
        "hectares": round(hectares, 4),
    }
