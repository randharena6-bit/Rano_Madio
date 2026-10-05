"""Regles metier : scoring de fiabilite, declassification, zones voisines."""

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from ranomadio_ai.domain.entities import ReportInput, TrustSignals, UserContext
from ranomadio_ai.domain.enums import Category, Urgency
from ranomadio_ai.domain.taxonomy import (
    CATEGORY_KEYWORDS,
    URGENCY_WEIGHTS,
)

__all__ = [
    "BASE_SCORE",
    "confidence_to_score",
    "has_category_keyword",
    "normalize_text",
    "score_trust",
    "suggest_category",
    "suggest_urgency",
    "urgency_from_weights",
]

BASE_SCORE = 50.0
"""Score de fiabilite neutre avant application des signaux."""


def normalize_text(text: str) -> str:
    """Minuscule, retire accents et ponctuation, collapse les espaces."""
    import unicodedata

    folded = "".join(
        char
        for char in unicodedata.normalize("NFKD", text.lower())
        if not unicodedata.combining(char)
    )
    cleaned = folded.translate(str.maketrans({c: " " for c in ",.;:!?/\\()[]{}\"'`"}))
    return " ".join(cleaned.split())


def has_category_keyword(normalized: str, category: Category) -> bool:
    """Vrai si la categorie apparait dans le texte normalise."""
    return any(keyword in normalized for keyword in CATEGORY_KEYWORDS.get(category, frozenset()))


def suggest_category(description: str) -> tuple[Category, float]:
    """Propose une categorie par regles lexicales.

    Retourne la categorie la plus concernee et un score de confiance dans [0, 1].
    """
    normalized = normalize_text(description)
    if not normalized:
        return Category.OTHER, 0.0

    scores: dict[Category, float] = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        if category is Category.OTHER:
            continue
        hits = sum(1 for keyword in keywords if keyword in normalized)
        if hits:
            scores[category] = hits / (hits + 1.5)

    if not scores:
        return Category.OTHER, 0.0

    best = max(scores, key=lambda key: scores[key])
    confidence = min(1.0, scores[best])
    if len(scores) > 1:
        ordered = sorted(scores.values(), reverse=True)
        margin = ordered[0] - ordered[1]
        confidence = confidence * (0.7 + 0.3 * min(1.0, margin * 3))
    return best, round(confidence, 4)


def urgency_from_weights(*weights: float) -> Urgency:
    """Convertit des poids (0-1) en niveau d'urgence."""
    if not weights:
        return Urgency.LOW
    total = sum(max(0.0, min(1.0, w)) for w in weights)
    count = len(weights)
    average = total / count
    for level in (Urgency.CRITICAL, Urgency.HIGH, Urgency.MEDIUM, Urgency.LOW):
        if average >= URGENCY_WEIGHTS[level]:
            return level
    return Urgency.LOW


def suggest_urgency(
    report: ReportInput,
    *,
    category: Category | None = None,
    context: UserContext | None = None,
) -> tuple[Urgency, float]:
    """Estime l'urgence d'un signalement.

    Combine mots-cles d'urgence, categorie, anciennete et contexte utilisateur.
    """
    normalized = normalize_text(report.description)
    weights: list[float] = []

    keyword_hit = any(term in normalized for term in ("urgent", "urgence", "immediat"))
    weights.append(0.9 if keyword_hit else 0.0)

    people = report.metadata.get("nb_persons")
    if isinstance(people, int):
        weights.append(min(1.0, people / 50))

    if category is not None:
        weights.append(
            0.8
            if category in {Category.WATER_OUTAGE, Category.FLOODING, Category.HEALTH}
            else 0.3
        )

    age_hours = (datetime.now(UTC) - report.created_at).total_seconds() / 3600
    weights.append(1.0 if age_hours <= 2 else 0.4 if age_hours <= 24 else 0.1)

    if report.mentions_audio:
        weights.append(0.2)

    if context is not None and context.history_reports >= 10:
        weights.append(0.1)

    urgency = urgency_from_weights(*weights)
    confidence = min(1.0, sum(weights) / max(1, len(weights)))
    return urgency, round(confidence, 4)


def confidence_to_score(confidence: float) -> float:
    """Convertit une confiance [0, 1] en score /100."""
    return round(max(0.0, min(1.0, confidence)) * 100, 2)


@dataclass(slots=True)
class TrustResult:
    """Sortie du scoring de fiabilite."""

    score: int
    signals: TrustSignals
    flags: list[str] = field(default_factory=list)


def score_trust(
    report: ReportInput,
    *,
    context: UserContext | None = None,
    confirmations: int = 0,
    reactions_total: int = 0,
    has_photo: bool = False,
    text_repetitive: bool = False,
) -> TrustResult:
    """Calcule un score de fiabilite 0-100 pour un signalement.

    Combine historique utilisateur, consensus communautaire, qualite du texte,
    presence de media et anciennete. Les seuils suivent Docs/conceptions_Eric.md.
    """
    signals = TrustSignals()
    flags: list[str] = []

    if context is not None:
        if context.history_confirmations or context.history_reports:
            ratio = context.history_confirmations / max(1, context.history_reports)
            signals.user_score = round(min(1.0, ratio), 4)
        else:
            signals.user_score = 0.3
            flags.append("nouveau_utilisateur")

        if context.trust_level in {"reliable", "verified_partner"}:
            signals.user_score = max(signals.user_score, 0.9)
        elif context.trust_level == "verifier":
            signals.user_score = max(signals.user_score, 0.7)

    if reactions_total > 0:
        signals.community_score = round(min(1.0, confirmations / reactions_total), 4)
    else:
        signals.community_score = 0.35

    tokens = normalize_text(report.description).split()
    signals.text_coherence = 1.0 if len(tokens) >= 8 else (0.6 if tokens else 0.0)
    if text_repetitive:
        signals.text_coherence = max(0.0, signals.text_coherence - 0.4)
        flags.append("texte_repetitif")

    signals.media_score = 0.8 if has_photo else 0.4

    age_hours = (datetime.now(UTC) - report.created_at).total_seconds() / 3600
    signals.recency_score = 1.0 if age_hours <= 6 else 0.6 if age_hours <= 48 else 0.3
    if age_hours > timedelta(hours=24).total_seconds():
        flags.append("signalement_ancien")

    if len(tokens) <= 2:
        flags.append("description_courte")
        signals.text_coherence = min(signals.text_coherence, 0.5)

    weights = {
        "user_score": 0.25,
        "community_score": 0.3,
        "text_coherence": 0.2,
        "media_score": 0.1,
        "recency_score": 0.15,
    }
    raw = sum(
        getattr(signals, key) * weight for key, weight in weights.items()
    )
    score = int(round(max(0.0, min(1.0, raw)) * 100))
    signals.penalties = flags
    return TrustResult(score=score, signals=signals, flags=flags)