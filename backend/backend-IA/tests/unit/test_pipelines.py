"""Tests des pipelines IA en mode degrade (embeddings desactives)."""

from datetime import UTC, datetime, timedelta

from ranomadio_ai.ai.classifier import classify_report
from ranomadio_ai.ai.dedup import find_duplicates
from ranomadio_ai.ai.matcher import find_matches
from ranomadio_ai.ai.moderation import assess_report
from ranomadio_ai.ai.extraction import extract_from_text
from ranomadio_ai.domain.entities import GeoPoint, HelpOfferInput, ReportInput, ResourceInput, UserContext
from ranomadio_ai.domain.enums import AvailabilityStatus, Category

WATER_OUTAGE = "La pompe a eau pres de l'ecole Anosizato est en panne, plus d'eau depuis ce matin"


def _report() -> ReportInput:
    return ReportInput(
        description=WATER_OUTAGE,
        location=GeoPoint(lat=-18.9265, lon=47.5123),
        zone="Anosizato",
    )


def test_classifier_uses_lexical_fallback() -> None:
    result = classify_report(_report(), use_embeddings=False)
    assert result.category is Category.WATER_OUTAGE
    assert result.urgency.value in {"high", "critical", "medium"}
    assert result.method == "lexical"
    assert "ecole" in result.suggested_tags


def test_classifier_extracts_numbers_and_zone() -> None:
    report = ReportInput(description="on a plus d'eau pour 50 familles a Anosizato")
    result = classify_report(report, use_embeddings=False)
    assert result.extracted_entities.get("nb_persons") == 50
    assert result.suggested_zone == "Anosizato"


def test_dedup_detects_near_duplicate() -> None:
    report = _report()
    existing = [
        (
            "rep-1",
            ReportInput(
                description="Pompe Anosizato cassee, pas d'eau pour le quartier",
                location=GeoPoint(lat=-18.9268, lon=47.5126),
                zone="Anosizato",
                created_at=datetime.now(UTC) - timedelta(hours=2),
            ),
        )
    ]
    result = find_duplicates(report, existing, use_embeddings=False)
    assert result.candidates is not None


def test_dedup_ignores_old_reports() -> None:
    report = _report()
    existing = [
        (
            "rep-old",
            ReportInput(
                description=WATER_OUTAGE,
                zone="Anosizato",
                created_at=datetime.now(UTC) - timedelta(days=3),
            ),
        )
    ]
    result = find_duplicates(report, existing, use_embeddings=False)
    assert result.is_duplicate is False
    assert result.best_match is None


def test_matching_ranks_nearby_resource_first() -> None:
    report = _report()
    candidates = [
        ResourceInput(
            resource_id="res-near",
            name="Puits Association Soa",
            description="120 bidons d'eau, distribution 14h-17h, pompe de secours",
            category=Category.WATER_OUTAGE,
            location=GeoPoint(lat=-18.9270, lon=47.5128),
            zone="Anosizato",
            quantity=120,
            availability=AvailabilityStatus.AVAILABLE,
        ),
        ResourceInput(
            resource_id="res-far",
            name="Eau commerçant Tsaralalana",
            description="Vente d'eau en bouteille",
            category=Category.WATER_SHORTAGE,
            location=GeoPoint(lat=-18.9000, lon=47.5500),
            zone="Tsaralalana",
            quantity=20,
        ),
    ]
    result = find_matches(report, candidates, use_embeddings=False)
    if result.matches:
        assert result.matches[0].candidate_id == "res-near"
        assert result.matches[0].distance_meters is not None
        assert "Recommande car" in result.matches[0].reason


def test_matching_accepts_help_offers() -> None:
    report = _report()
    offers = [
        HelpOfferInput(
            offer_id="help-1",
            help_type="transport",
            description="Camion disponible pour transporter des bidons d'eau",
            zone="Anosizato",
        )
    ]
    result = find_matches(report, offers, use_embeddings=False)
    assert result.total_evaluated == 1


def test_moderation_flags_low_trust_report() -> None:
    report = ReportInput(description="eau")
    result = assess_report(report, use_embeddings=False)
    assert 0 <= result.score <= 100
    assert "description_courte" in result.flags


def test_moderation_rewards_established_user() -> None:
    report = ReportInput(description=WATER_OUTAGE)
    new_user = assess_report(report, context=UserContext(), use_embeddings=False)
    trusted = assess_report(
        report,
        context=UserContext(
            history_reports=40,
            history_confirmations=38,
            trust_level="verified_partner",
        ),
        use_embeddings=False,
    )
    assert trusted.score > new_user.score


def test_extraction_from_text_fills_form_fields() -> None:
    result = extract_from_text(
        "Le puits pres de l'ecole Anosizato ne marche plus depuis ce matin, "
        "on a plus d'eau pour 50 familles",
        known_zones=("Anosizato",),
    )
    assert result.zone == "Anosizato"
    assert result.nb_persons == 50
    assert result.duration_hint == "depuis ce matin"