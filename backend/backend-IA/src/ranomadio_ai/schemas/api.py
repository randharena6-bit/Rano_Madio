"""Contrats Pydantic exposes par l'API IA."""

from datetime import datetime

from pydantic import BaseModel, Field

from ranomadio_ai.domain.entities import (
    GeoPoint,
    HelpOfferInput,
    ResourceInput,
    UserContext,
)
from ranomadio_ai.domain.enums import Category, Urgency

__all__ = [
    "Candidate",
    "ClassifyRequest",
    "ClassifyResponse",
    "DedupRequest",
    "DedupResponse",
    "DuplicateCandidateOut",
    "EmbeddingRequest",
    "EmbeddingResponse",
    "ExtractRequest",
    "ExtractResponse",
    "HealthResponse",
    "MatchCandidateOut",
    "MatchRequest",
    "MatchResponse",
    "ModerationRequest",
    "ModerationResponse",
    "PipelineRequest",
    "PipelineResponse",
    "SimilarityRequest",
    "SimilarityResponse",
]

Candidate = ResourceInput | HelpOfferInput


class HealthResponse(BaseModel):
    """Etat du service."""

    status: str
    version: str
    environment: str
    models: dict[str, object]


class ClassifyRequest(BaseModel):
    """Demande de categorisation."""

    description: str = Field(min_length=1, max_length=4000)
    zone: str | None = Field(default=None, max_length=100)
    location: GeoPoint | None = None
    metadata: dict[str, object] = Field(default_factory=dict)
    context: UserContext | None = None
    use_embeddings: bool = True


class ClassifyResponse(BaseModel):
    """Reponse de categorisation."""

    category: Category
    category_label: str
    urgency: Urgency
    confidence: float
    score: int
    suggested_tags: list[str] = Field(default_factory=list)
    suggested_zone: str | None = None
    extracted_entities: dict[str, object] = Field(default_factory=dict)
    method: str


class EmbeddingRequest(BaseModel):
    """Demande d'embeddings."""

    texts: list[str] = Field(min_length=1, max_length=256)


class EmbeddingResponse(BaseModel):
    """Reponse d'embeddings (dimension + matrice)."""

    dimension: int
    vectors: list[list[float]]


class SimilarityRequest(BaseModel):
    """Demande de similarite entre deux textes."""

    text_a: str = Field(min_length=1, max_length=4000)
    text_b: str = Field(min_length=1, max_length=4000)
    use_embeddings: bool = True


class SimilarityResponse(BaseModel):
    """Reponse de similarite."""

    similarity: float


class DuplicateCandidateOut(BaseModel):
    """Candidat doublon serialise."""

    report_id: str
    text_similarity: float
    lexical_similarity: float
    distance_meters: int | None = None
    age_hours: float
    score: float


class DedupRequest(BaseModel):
    """Demande de detection de doublons."""

    report: "ReportPayload"
    existing_reports: list["ExistingReportPayload"] = Field(default_factory=list)
    use_embeddings: bool = True


class DedupResponse(BaseModel):
    """Reponse de deduplication."""

    is_duplicate: bool
    best_match: DuplicateCandidateOut | None = None
    candidates: list[DuplicateCandidateOut] = Field(default_factory=list)


class MatchRequest(BaseModel):
    """Demande de matching."""

    report: "ReportPayload"
    candidates: list[Candidate] = Field(default_factory=list)
    use_embeddings: bool = True


class MatchCandidateOut(BaseModel):
    """Match serialise."""

    candidate_id: str
    candidate_type: str
    name: str
    semantic_score: float
    geo_score: float
    freshness_score: float
    availability_score: float
    score: float
    distance_meters: int | None = None
    reason: str


class MatchResponse(BaseModel):
    """Reponse de matching."""

    report_type: str
    matches: list[MatchCandidateOut] = Field(default_factory=list)
    total_evaluated: int = 0


class ModerationRequest(BaseModel):
    """Demande d'evaluation de fiabilite."""

    report: "ReportPayload"
    category: Category | None = None
    context: UserContext | None = None
    confirmations: int = Field(default=0, ge=0)
    reactions_total: int = Field(default=0, ge=0)
    has_photo: bool = False
    use_embeddings: bool = True


class ModerationResponse(BaseModel):
    """Reponse de moderation."""

    score: int
    badge: str
    priority_queue: bool
    flags: list[str] = Field(default_factory=list)
    signals: dict[str, float] = Field(default_factory=dict)
    recommendation: str


class ExtractRequest(BaseModel):
    """Demande d'extraction depuis un texte deja transcrit."""

    text: str = Field(min_length=1, max_length=8000)
    location: GeoPoint | None = None


class ExtractResponse(BaseModel):
    """Reponse d'extraction."""

    description: str
    zone: str | None = None
    nb_persons: int | None = None
    duration_hint: str | None = None
    keywords: list[str] = Field(default_factory=list)
    language: str | None = None


class ReportPayload(BaseModel):
    """Signalement minimal transporte dans les requetes."""

    description: str = Field(min_length=1, max_length=4000)
    location: GeoPoint | None = None
    zone: str | None = Field(default=None, max_length=100)
    created_at: datetime | None = None
    metadata: dict[str, object] = Field(default_factory=dict)


class ExistingReportPayload(ReportPayload):
    """Signalement existant, avec identifiant."""

    report_id: str


class PipelineRequest(BaseModel):
    """Requete du flux complet : dedup -> classify -> match -> moderer."""

    report: ReportPayload
    existing_reports: list[ExistingReportPayload] = Field(default_factory=list)
    candidates: list[Candidate] = Field(default_factory=list)
    context: UserContext | None = None
    confirmations: int = Field(default=0, ge=0)
    reactions_total: int = Field(default=0, ge=0)
    has_photo: bool = False
    use_embeddings: bool = True


class PipelineResponse(BaseModel):
    """Reponse du flux complet."""

    classification: ClassifyResponse
    dedup: DedupResponse
    matches: MatchResponse
    moderation: ModerationResponse


DedupRequest.model_rebuild()
MatchRequest.model_rebuild()
ModerationRequest.model_rebuild()
PipelineRequest.model_rebuild()