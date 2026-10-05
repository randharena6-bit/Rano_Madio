"""Tests des helpers geo et texte (sans modele)."""

from ranomadio_ai.domain.entities import GeoPoint
from ranomadio_ai.utils.geo import geo_score, haversine_meters, is_within
from ranomadio_ai.utils.text import (
    extract_mentioned_zones,
    extract_numbers,
    jaccard_similarity,
    looks_repetitive,
)


def test_haversine_zero_for_same_point() -> None:
    point = GeoPoint(lat=-18.9265, lon=47.5123)
    assert haversine_meters(point, point) == 0


def test_haversine_anosizato_distance_is_plausible() -> None:
    origin = GeoPoint(lat=-18.9265, lon=47.5123)
    target = GeoPoint(lat=-18.9278, lon=47.5135)
    distance = haversine_meters(origin, target)
    assert 150 < distance < 250


def test_is_within_respects_threshold() -> None:
    origin = GeoPoint(lat=-18.9265, lon=47.5123)
    far = GeoPoint(lat=-18.9500, lon=47.6000)
    assert not is_within(origin, far, 200)


def test_geo_score_is_monotonic_and_neutral_without_distance() -> None:
    assert geo_score(0, max_distance_m=1000) == 1.0
    assert geo_score(500, max_distance_m=1000) == 0.5
    assert geo_score(None, max_distance_m=1000) == 0.5


def test_jaccard_similarity_bounds() -> None:
    assert jaccard_similarity("pompe en panne", "pompe en panne") == 1.0
    assert 0 < jaccard_similarity("pompe a eau en panne", "besoin de bidons d eau") < 1


def test_looks_repetitive_detects_spam() -> None:
    assert looks_repetitive("eau eau eau eau eau eau eau eau eau eau eau")
    assert not looks_repetitive("le puits pres de l ecole ne fonctionne plus depuis ce matin")


def test_extract_mentioned_zones() -> None:
    zones = extract_mentioned_zones("Le puits près de l'école Anosizato est en panne")
    assert any("anosizato" in zone for zone in zones)


def test_extract_numbers() -> None:
    assert extract_numbers("on a besoin d eau pour 50 familles") == (50,)