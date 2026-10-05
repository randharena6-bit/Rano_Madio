"""Matching semantique besoin <-> ressource / intervenant / volontaire.

Au-dela des regles "meme categorie" : la similarite d'embeddings sert a
trouver des correspondances implicites ("bidons" <-> "besoin eau").
Chaque proposition est explicable (champ `reason`), comme l'exige le produit.
"""

from dataclasses import dataclass
from datetime import UTC, datetime

from ranomadio_ai.ai.embeddings import cosine_matrix
from ranomadio_ai.core.config import Settings, get_settings
from ranomadio_ai.domain.entities import (
    Candidate,
    HelpOfferInput,
    MatchResult,
    ReportInput,
    ResourceInput,
    ScoredCandidate,
)
from ranomadio_ai.domain.enums import (
    AvailabilityStatus,
    HelpOfferStatus,
    MatchType,
    ReportType,
)
from ranomadio_ai.domain.taxonomy import CATEGORY_KEYWORDS, CATEGORY_LABELS
from ranomadio_ai.utils.geo import geo_score, haversine_meters
from ranomadio_ai.utils.text import jaccard_similarity

__all__ = ["MatchCandidate", "find_matches"]

_FRESH_HOURS = 48
_AVAILABILITY_SCORE: dict[AvailabilityStatus, float] = {
    AvailabilityStatus.AVAILABLE: 1.0,
    AvailabilityStatus.LIMITED: 0.6,
    AvailabilityStatus.UNAVAILABLE: 0.1,
    AvailabilityStatus.EXPIRED: 0.0,
}
_OFFER_STATUS_SCORE: dict[HelpOfferStatus, float] = {
    HelpOfferStatus.AVAILABLE: 1.0,
    HelpOfferStatus.MATCHED: 0.6,
    HelpOfferStatus.IN_PROGRESS: 0.4,
    HelpOfferStatus.DONE: 0.1,
    HelpOfferStatus.CANCELLED: 0.0,
}


@dataclass(slots=True)
class MatchCandidate:
    """Candidat brut converti en objet matchable."""

    candidate_id: str
    candidate_type: MatchType
    name: str
    text: str
    category: str
    zone: str | None
    latitude: float | None
    longitude: float | None
    availability_score: float
    freshness_score: float
    updated_at: datetime
    quantity: int | None = None


def _freshness_score(timestamp: datetime, now: datetime) -> float:
    """Score de fraicheur : 1.0 si < 48h, decroissant ensuite."""
    age_hours = (now - timestamp).total_seconds() / 3600
    if age_hours <= _FRESH_HOURS:
        return 1.0
    return round(max(0.1, 1.0 - (age_hours - _FRESH_HOURS) / 240), 4)


def _as_candidate(candidate: Candidate, report_type: ReportType, now: datetime) -> MatchCandidate:
    """Normalise un candidat en structure de matching."""
    match_type = (
        MatchType.NEED_RESOURCE
        if report_type is ReportType.NEED
        else MatchType.HELP_VOLUNTEER
        if report_type is ReportType.CAPACITY
        else MatchType.PROBLEM_INTERVENOR
    )

    if isinstance(candidate, ResourceInput):
        return MatchCandidate(
            candidate_id=candidate.resource_id,
            candidate_type=match_type,
            name=candidate.name,
            text=" ".join(
                part
                for part in (
                    candidate.name,
                    candidate.description,
                    CATEGORY_LABELS.get(candidate.category, candidate.category.value),
                    f"quantite {candidate.quantity}" if candidate.quantity else "",
                )
                if part
            ),
            category=candidate.category.value,
            zone=candidate.zone,
            latitude=candidate.location.lat if candidate.location else None,
            longitude=candidate.location.lon if candidate.location else None,
            availability_score=_AVAILABILITY_SCORE.get(candidate.availability, 0.5),
            freshness_score=_freshness_score(candidate.updated_at, now),
            updated_at=candidate.updated_at,
            quantity=candidate.quantity,
        )

    return MatchCandidate(
        candidate_id=candidate.offer_id,
        candidate_type=match_type,
        name=candidate.help_type,
        text=" ".join(
            part
            for part in (
                candidate.help_type,
                candidate.description,
                candidate.capacity or "",
            )
            if part
        ),
        category=candidate.help_type,
        zone=candidate.zone,
        latitude=candidate.location.lat if candidate.location else None,
        longitude=candidate.location.lon if candidate.location else None,
        availability_score=_OFFER_STATUS_SCORE.get(candidate.status, 0.5),
        freshness_score=_freshness_score(candidate.starts_at or now, now),
        updated_at=candidate.starts_at or now,
    )


def _distance_between(report: ReportInput, candidate: MatchCandidate) -> int | None:
    """Distance rapport-candidat, ou None si l'une des coordonnees manque."""
    if report.location and candidate.latitude is not None and candidate.longitude is not None:
        from ranomadio_ai.domain.entities import GeoPoint

        return haversine_meters(report.location, GeoPoint(lat=candidate.latitude, lon=candidate.longitude))
    if report.zone and candidate.zone and report.zone.lower() == candidate.zone.lower():
        return 0
    return None


def _explain(
    report: ReportInput,
    candidate: MatchCandidate,
    *,
    semantic: float,
    distance_m: int | None,
    same_category: bool,
) -> str:
    """Construit une explication lisible en francais."""
    reasons: list[str] = []
    if same_category:
        reasons.append("meme categorie")
    if semantic >= 0.75:
        reasons.append("description tres proche du besoin")
    elif semantic >= 0.55:
        reasons.append("description compatible")
    if distance_m is not None:
        if distance_m <= 500:
            reasons.append(f"a {distance_m} m")
        else:
            reasons.append(f"a environ {distance_m // 1000} km")
    if report.zone and candidate.zone and report.zone.lower() == candidate.zone.lower():
        reasons.append(f"meme zone ({candidate.zone})")
    if candidate.availability_score >= 1.0:
        reasons.append("disponible maintenant")
    if candidate.freshness_score >= 1.0:
        reasons.append("info verifiee recemment")
    if candidate.quantity:
        reasons.append(f"quantite {candidate.quantity}")

    if not reasons:
        reasons.append("proximite semantique faible")
    return f"Recommande car : {', '.join(reasons)}."


def find_matches(
    report: ReportInput,
    candidates: list[Candidate],
    *,
    settings: Settings | None = None,
    use_embeddings: bool = True,
) -> MatchResult:
    """Classe les candidats par compatibilite et retourne le top-k."""
    settings = settings or get_settings()
    now = datetime.now(UTC)

    prepared = [_as_candidate(candidate, ReportType.PROBLEM, now) for candidate in candidates]
    if not prepared:
        return MatchResult(report_type=ReportType.PROBLEM, matches=[], total_evaluated=0)

    semantic_scores: list[float] = []
    if use_embeddings:
        try:
            semantic_scores = cosine_matrix(report.description, [c.text for c in prepared])
        except Exception:  # noqa: BLE001
            semantic_scores = []

    report_keywords = set().union(
        *[set(words) for words in CATEGORY_KEYWORDS.values()],
        frozenset(),
    )

    scored: list[ScoredCandidate] = []
    for index, candidate in enumerate(prepared):
        semantic = (
            semantic_scores[index]
            if semantic_scores
            else jaccard_similarity(report.description, candidate.text)
        )
        lexical = jaccard_similarity(report.description, candidate.text)

        distance = _distance_between(report, candidate)
        if distance is not None and distance > settings.match_max_distance_m:
            continue

        geo = geo_score(distance, max_distance_m=settings.match_max_distance_m)
        same_category = candidate.category in report_keywords
        category_bonus = 0.1 if same_category else 0.0

        score = (
            semantic * 0.5
            + lexical * 0.15
            + geo * 0.2
            + candidate.freshness_score * 0.05
            + candidate.availability_score * 0.1
            + category_bonus
        )

        if score < settings.match_min_semantic_score:
            continue

        scored.append(
            ScoredCandidate(
                candidate_id=candidate.candidate_id,
                candidate_type=candidate.candidate_type,
                name=candidate.name,
                semantic_score=semantic,
                geo_score=geo,
                freshness_score=candidate.freshness_score,
                availability_score=candidate.availability_score,
                score=score,
                distance_meters=distance,
                reason=_explain(
                    report,
                    candidate,
                    semantic=semantic,
                    distance_m=distance,
                    same_category=same_category,
                ),
            )
        )

    scored.sort(key=lambda item: item.score, reverse=True)
    return MatchResult(
        report_type=ReportType.PROBLEM,
        matches=scored[: settings.match_top_k],
        total_evaluated=len(prepared),
    )