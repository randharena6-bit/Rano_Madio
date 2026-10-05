"""Entites metier utilisees par les pipelines IA."""

from datetime import UTC, datetime
from typing import Self

from pydantic import BaseModel, Field, computed_field, model_validator

from ranomadio_ai.domain.enums import (
    AvailabilityStatus,
    Category,
    HelpOfferStatus,
    MatchType,
    ReportType,
    Urgency,
)

__all__ = [
    "Candidate",
    "GeoPoint",
    "MatchResult",
    "ReportInput",
    "ResourceInput",
    "HelpOfferInput",
    "ScoredCandidate",
    "TrustSignals",
    "UserContext",
]


def _utcnow() -> datetime:
    return datetime.now(UTC)


class GeoPoint(BaseModel):
    """Point geographique (lat/lon, WGS84)."""

    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)

    def as_tuple(self) -> tuple[float, float]:
        """Retourne le couple (lat, lon)."""
        return self.lat, self.lon


class UserContext(BaseModel):
    """Contexte utilisateur minimal, fourni par le backend principal."""

    user_id: str | None = None
    role: str = "resident"
    trust_level: str = "new"
    history_reports: int = Field(default=0, ge=0)
    history_confirmations: int = Field(default=0, ge=0)
    hours_since_last_report: float | None = Field(default=None, ge=0)


class ReportInput(BaseModel):
    """Signalement soumis a l'IA (texte libre et/ou audio deja transcrit)."""

    description: str = Field(min_length=1, max_length=4000)
    location: GeoPoint | None = None
    zone: str | None = Field(default=None, max_length=100)
    created_at: datetime = Field(default_factory=_utcnow)
    metadata: dict[str, object] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _clean(self) -> Self:
        self.description = " ".join(self.description.split())
        return self

    @computed_field  # type: ignore[prop-decorator]
    @property
    def has_location(self) -> bool:
        """Vrai si le signalement est geolocalise."""
        return self.location is not None

    @property
    def mentions_audio(self) -> bool:
        """Vrai si le signalement provient d'une transcription vocale."""
        return bool(self.metadata.get("from_audio"))


class ResourceInput(BaseModel):
    """Ressource mise a disposition (puits, camion, association...)."""

    resource_id: str
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    category: Category
    location: GeoPoint | None = None
    zone: str | None = Field(default=None, max_length=100)
    quantity: int | None = Field(default=None, ge=0)
    availability: AvailabilityStatus = AvailabilityStatus.AVAILABLE
    accessible: bool = True
    updated_at: datetime = Field(default_factory=_utcnow)


class HelpOfferInput(BaseModel):
    """Offre d'aide ("je peux aider")."""

    offer_id: str
    help_type: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=2000)
    zone: str | None = Field(default=None, max_length=100)
    location: GeoPoint | None = None
    capacity: str | None = Field(default=None, max_length=200)
    status: HelpOfferStatus = HelpOfferStatus.AVAILABLE
    starts_at: datetime | None = None
    ends_at: datetime | None = None


Candidate = ResourceInput | HelpOfferInput
"""Tout candidat evaluable par le matcher."""


class ScoredCandidate(BaseModel):
    """Candidat avec son score de compatibilite et son explication."""

    candidate_id: str
    candidate_type: MatchType
    name: str
    semantic_score: float = Field(ge=0, le=1)
    geo_score: float = Field(default=0, ge=0, le=1)
    freshness_score: float = Field(default=0, ge=0, le=1)
    availability_score: float = Field(default=0, ge=0, le=1)
    score: float = Field(ge=0, le=1)
    distance_meters: int | None = None
    reason: str

    @model_validator(mode="after")
    def _clamp(self) -> Self:
        self.semantic_score = round(max(0.0, min(1.0, self.semantic_score)), 4)
        self.geo_score = round(max(0.0, min(1.0, self.geo_score)), 4)
        self.freshness_score = round(max(0.0, min(1.0, self.freshness_score)), 4)
        self.availability_score = round(max(0.0, min(1.0, self.availability_score)), 4)
        self.score = round(max(0.0, min(1.0, self.score)), 4)
        return self


class MatchResult(BaseModel):
    """Reponse du moteur de matching."""

    report_type: ReportType
    matches: list[ScoredCandidate] = Field(default_factory=list)
    total_evaluated: int = Field(default=0, ge=0)

    @property
    def top_score(self) -> float:
        """Meilleur score de la liste."""
        return self.matches[0].score if self.matches else 0.0


class TrustSignals(BaseModel):
    """Signaux de fiabilite agreges pour le scoring."""

    user_score: float = Field(default=0.5, ge=0, le=1)
    text_coherence: float = Field(default=0.5, ge=0, le=1)
    community_score: float = Field(default=0.5, ge=0, le=1)
    media_score: float = Field(default=0.5, ge=0, le=1)
    recency_score: float = Field(default=0.5, ge=0, le=1)
    penalties: list[str] = Field(default_factory=list)