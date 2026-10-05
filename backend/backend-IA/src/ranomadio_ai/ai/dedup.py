"""Deduplication intelligente des signalements.

Empreinte semantique (embeddings) + proximite geographique + fenetre temporelle.
Objectif : eviter 5 signalements pour la meme panne et alimenter l'index
de fiabilite (Docs/conceptions_Eric.md, section 2).
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

from ranomadio_ai.ai.embeddings import cosine_matrix
from ranomadio_ai.core.config import Settings, get_settings
from ranomadio_ai.core.logging import get_logger
from ranomadio_ai.domain.entities import GeoPoint, ReportInput
from ranomadio_ai.utils.geo import haversine_meters
from ranomadio_ai.utils.text import jaccard_similarity
from ranomadio_ai.utils.time import utcnow

__all__ = ["DuplicateCandidate", "DedupResult", "find_duplicates"]

logger = get_logger(__name__)


@dataclass(slots=True)
class DuplicateCandidate:
    """Signalement existant proche du nouveau rapport."""

    report_id: str
    text_similarity: float
    lexical_similarity: float
    distance_meters: int | None
    age_hours: float
    score: float

    def to_dict(self) -> dict[str, object]:
        """Serialise le candidat pour l'API."""
        return {
            "report_id": self.report_id,
            "text_similarity": round(self.text_similarity, 4),
            "lexical_similarity": round(self.lexical_similarity, 4),
            "distance_meters": self.distance_meters,
            "age_hours": round(self.age_hours, 2),
            "score": round(self.score, 4),
        }


@dataclass(slots=True)
class DedupResult:
    """Resultat de la recherche de doublons."""

    is_duplicate: bool
    best_match: DuplicateCandidate | None = None
    candidates: list[DuplicateCandidate] | None = None


def _window_start(settings: Settings, now: datetime) -> datetime:
    """Debut de la fenetre temporelle de deduplication."""
    return now - timedelta(hours=settings.dedup_max_age_hours)


def _distance(
    origin: GeoPoint | None,
    target_location: GeoPoint | None,
    target_zone: str | None,
    origin_zone: str | None,
) -> int | None:
    """Distance entre le nouveau rapport et un existant (None si inconnue)."""
    if origin and target_location:
        return haversine_meters(origin, target_location)
    if origin_zone and target_zone and origin_zone.lower() == target_zone.lower():
        return 0
    return None


def find_duplicates(
    report: ReportInput,
    existing_reports: list[tuple[str, ReportInput]],
    *,
    settings: Settings | None = None,
    use_embeddings: bool = True,
) -> DedupResult:
    """Cherche les signalements potentiellement dupliques.

    Un candidat est retenu si le score global depasse `dedup_min_similarity`,
    que la distance est sous `dedup_max_distance_m` et que la fenetre
    temporelle n'est pas depassee. Sans embeddings, repli sur Jaccard.
    """
    settings = settings or get_settings()
    now = utcnow()
    window_start = _window_start(settings, now)

    in_window = [
        (report_id, existing)
        for report_id, existing in existing_reports
        if window_start <= existing.created_at <= now + timedelta(minutes=5)
    ]
    if not in_window:
        return DedupResult(is_duplicate=False, best_match=None, candidates=[])

    semantic_scores: list[float] = []
    if use_embeddings:
        try:
            semantic_scores = cosine_matrix(
                report.description,
                [existing.description for _, existing in in_window],
            )
        except Exception:  # noqa: BLE001
            semantic_scores = []

    scored: list[DuplicateCandidate] = []
    for index, (report_id, existing) in enumerate(in_window):
        if semantic_scores:
            text_similarity = semantic_scores[index]
        else:
            text_similarity = jaccard_similarity(report.description, existing.description)

        lexical = jaccard_similarity(report.description, existing.description)
        distance = _distance(
            report.location,
            existing.location,
            existing.zone,
            report.zone,
        )

        if distance is not None and distance > settings.dedup_max_distance_m:
            continue

        geo_weight = 1.0 if distance is not None and distance <= settings.dedup_max_distance_m else 0.5
        combined = round(text_similarity * 0.75 + lexical * 0.25, 4)
        score = round(combined * geo_weight, 4)
        age = (now - existing.created_at).total_seconds() / 3600

        scored.append(
            DuplicateCandidate(
                report_id=report_id,
                text_similarity=text_similarity,
                lexical_similarity=lexical,
                distance_meters=distance,
                age_hours=age,
                score=score,
            )
        )

    scored.sort(key=lambda candidate: candidate.score, reverse=True)
    matches = [
        candidate
        for candidate in scored
        if candidate.score >= settings.dedup_min_similarity
    ]
    return DedupResult(
        is_duplicate=bool(matches),
        best_match=matches[0] if matches else None,
        candidates=matches[:5] or scored[:5],
    )