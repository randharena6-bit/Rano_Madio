"""Tests des regles metier et de la taxonomie."""

from ranomadio_ai.domain.enums import Category, Urgency
from ranomadio_ai.domain.rules import (
    normalize_text,
    score_trust,
    suggest_category,
    suggest_urgency,
)
from ranomadio_ai.domain.entities import ReportInput


def test_normalize_text_removes_accents_and_punctuation() -> None:
    assert normalize_text("Panne d'eau, urgent !") == "panne d eau urgent"


def test_suggest_category_detects_water_outage() -> None:
    category, confidence = suggest_category(
        "Le puits pres de l'ecole ne marche plus, pas d'eau depuis ce matin"
    )
    assert category is Category.WATER_OUTAGE
    assert confidence > 0


def test_suggest_category_falls_back_to_other() -> None:
    category, _ = suggest_category("xyzzy incomprehensible")
    assert category is Category.OTHER


def test_suggest_urgency_raises_with_urgent_keywords() -> None:
    report = ReportInput(description="urgence critique, personnes en danger")
    urgency, _ = suggest_urgency(report)
    assert urgency in {Urgency.HIGH, Urgency.CRITICAL}


def test_suggest_urgency_low_for_quiet_report() -> None:
    report = ReportInput(description="petit probleme de poubelle dans la rue")
    urgency, _ = suggest_urgency(report)
    assert urgency in {Urgency.LOW, Urgency.MEDIUM}


def test_score_trust_penalizes_repetitive_text() -> None:
    clean = ReportInput(description="La pompe a eau de l'ecole Anosizato est en panne depuis ce matin")
    spam = ReportInput(description="eau eau eau eau eau eau eau eau eau eau eau eau")
    assert score_trust(clean).score > score_trust(spam).score