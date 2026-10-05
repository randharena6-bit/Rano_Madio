"""Moderation assistee et score de fiabilite (0-100).

Agrege les signaux de `domain.rules` avec une verification semantique
(coherence interne texte / categorie) lorsque les embeddings sont disponibles.
"""

from dataclasses import dataclass, field
from typing import Any

from ranomadio_ai.ai.embeddings import cosine_matrix
from ranomadio_ai.domain.entities import ReportInput, UserContext
from ranomadio_ai.domain.enums import Category
from ranomadio_ai.domain.rules import score_trust
from ranomadio_ai.domain.taxonomy import CATEGORY_KEYWORDS

__all__ = ["TrustAssessment", "assess_report"]

_VERIFIED_THRESHOLD = 60
_PRIORITY_THRESHOLD = 40

_BADGE_VERIFIED = "verifie_ia_communaute"
_BADGE_PRIORITY = "a_verifier_prioritaire"
_BADGE_NORMAL = "normal"


@dataclass(slots=True)
class TrustAssessment:
    """Evaluation de fiabilite d'un signalement."""

    score: int
    badge: str
    priority_queue: bool
    flags: list[str] = field(default_factory=list)
    signals: dict[str, Any] = field(default_factory=dict)

    @property
    def recommendation(self) -> str:
        """Consigne actionnable pour le moderateur."""
        if self.priority_queue:
            return "A verifier en priorite par un moderateur."
        if self.badge == _BADGE_VERIFIED:
            return "Signement fiable, validation automatique possible."
        return "Verification standard par la communaute."


def _category_coherence(description: str, category: Category) -> float:
    """Score de coherence entre la categorie proposee et le texte."""
    keywords = CATEGORY_KEYWORDS.get(category, frozenset())
    if not keywords:
        return 0.5
    normalized = description.lower()
    hits = sum(1 for keyword in keywords if keyword in normalized)
    if not hits:
        return 0.3
    return round(min(1.0, 0.5 + hits / (hits + 1)), 4)


def assess_report(
    report: ReportInput,
    *,
    category: Category | None = None,
    context: UserContext | None = None,
    confirmations: int = 0,
    reactions_total: int = 0,
    has_photo: bool = False,
    text_repetitive: bool = False,
    use_embeddings: bool = True,
) -> TrustAssessment:
    """Evalue la fiabilite d'un signalement et renvoie un badge."""
    from ranomadio_ai.utils.text import looks_repetitive

    repetitive = text_repetitive or looks_repetitive(report.description)
    result = score_trust(
        report,
        context=context,
        confirmations=confirmations,
        reactions_total=reactions_total,
        has_photo=has_photo,
        text_repetitive=repetitive,
    )
    score = result.score
    flags = list(result.flags)

    if category is not None:
        coherence = _category_coherence(report.description, category)
        adjusted = int(round(score * 0.8 + coherence * 100 * 0.2))

        if coherence < 0.4:
            flags.append("categorie_incoherente")

        if use_embeddings:
            try:
                semantic = cosine_matrix(
                    report.description,
                    [f"description d'un signalement de categorie {category.value}"],
                )[0]
                adjusted = int(round(adjusted * 0.85 + semantic * 100 * 0.15))
            except Exception:  # noqa: BLE001
                pass

        score = max(0, min(100, adjusted))

    if score >= _VERIFIED_THRESHOLD:
        badge = _BADGE_VERIFIED
    elif score < _PRIORITY_THRESHOLD:
        badge = _BADGE_PRIORITY
    else:
        badge = _BADGE_NORMAL

    return TrustAssessment(
        score=score,
        badge=badge,
        priority_queue=score < _PRIORITY_THRESHOLD,
        flags=sorted(set(flags)),
        signals={
            "user_score": result.signals.user_score,
            "community_score": result.signals.community_score,
            "text_coherence": result.signals.text_coherence,
            "media_score": result.signals.media_score,
            "recency_score": result.signals.recency_score,
        },
    )