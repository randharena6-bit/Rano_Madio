"""Helpers geometriques (distance, normalisation, zones)."""

from math import asin, cos, radians, sin, sqrt

from ranomadio_ai.domain.entities import GeoPoint

__all__ = [
    "EARTH_RADIUS_M",
    "haversine_meters",
    "geo_score",
    "is_within",
]

EARTH_RADIUS_M = 6_371_000.0
"""Rayon moyen terrestre en metres."""


def haversine_meters(origin: GeoPoint, target: GeoPoint) -> float:
    """Distance orthodromique entre deux points, en metres."""
    lat1, lon1 = origin.lat, origin.lon
    lat2, lon2 = target.lat, target.lon

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return int(round(2 * EARTH_RADIUS_M * asin(sqrt(a))))


def is_within(origin: GeoPoint, target: GeoPoint, max_distance_m: int) -> bool:
    """Vrai si la distance entre deux points est inferieure au seuil."""
    return haversine_meters(origin, target) <= max_distance_m


def geo_score(distance_meters: int | None, *, max_distance_m: int) -> float:
    """Score de proximite dans [0, 1], lineaire et borne.

    Sans coordonnees, retourne 0.5 (neutre) pour ne pas penaliser a tort.
    """
    if distance_meters is None or max_distance_m <= 0:
        return 0.5
    ratio = max(0.0, 1.0 - distance_meters / max_distance_m)
    return round(ratio, 4)