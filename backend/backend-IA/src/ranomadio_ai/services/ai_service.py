"""Couche de services : orchestration API <-> pipelines IA.

Isole les routes des details d'assemblage (conversion payloads -> entites,
repli en mode degrade quand le modele est indisponible).
"""

from typing import Sequence

from ranomadio_ai.ai.classifier import ClassificationResult, classify_report
from ranomadio_ai.ai.dedup import DedupResult, find_duplicates
from ranomadio_ai.ai.matcher import find_matches
from ranomadio_ai.ai.moderation import TrustAssessment, assess_report
from ranomadio_ai.core.config import Settings, get_settings
from ranomadio_ai.core.logging import get_logger
from ranomadio_ai.domain.entities import (
    Candidate,
    ReportInput,
    UserContext,
)
from ranomadio_ai.domain.taxonomy import DEFAULT_ZONES
from ranomadio_ai.schemas.api import (
    ClassifyRequest,
    ClassifyResponse,
    DedupRequest,
    DedupResponse,
    ExistingReportPayload,
    MatchCandidateOut,
    MatchRequest,
    MatchResponse,
    ModerationRequest,
    ModerationResponse,
    PipelineRequest,
    PipelineResponse,
    ReportPayload,
)

__all__ = ["AIService", "existing_from_payloads", "get_service"]

logger = get_logger(__name__)


def _to_report_input(payload: ReportPayload) -> ReportInput:
    """Convertit un payload API en entite metier."""
    kwargs: dict[str, object] = {
        "description": payload.description,
        "location": payload.location,
        "zone": payload.zone,
        "metadata": payload.metadata,
    }
    if payload.created_at is not None:
        kwargs["created_at"] = payload.created_at
    return ReportInput(**kwargs)  # type: ignore[arg-type]


def _classification_response(result: ClassificationResult) -> ClassifyResponse:
    """Convertit le resultat du classifieur en reponse API."""
    return ClassifyResponse(
        category=result.category,
        category_label=result.category_label,
        urgency=result.urgency,
        confidence=result.confidence,
        score=result.score,
        suggested_tags=result.suggested_tags,
        suggested_zone=result.suggested_zone,
        extracted_entities=result.extracted_entities,
        method=result.method,
    )


class AIService:
    """Facade unique utilisee par les routes."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.known_zones: tuple[str, ...] = DEFAULT_ZONES

    def classify(self, request: ClassifyRequest) -> ClassifyResponse:
        """Pipeline de categorisation."""
        report = ReportInput(
            description=request.description,
            location=request.location,
            zone=request.zone,
            metadata=request.metadata,
        )
        result = classify_report(
            report,
            context=request.context,
            use_embeddings=request.use_embeddings,
            known_zones=self.known_zones,
        )
        return _classification_response(result)

    def deduplicate(self, request: DedupRequest) -> DedupResponse:
        """Pipeline de deduplication."""
        report = _to_report_input(request.report)
        existing: list[tuple[str, ReportInput]] = [
            (item.report_id, _to_report_input(item))
            for item in request.existing_reports
        ]
        result: DedupResult = find_duplicates(
            report,
            existing,
            settings=self.settings,
            use_embeddings=request.use_embeddings,
        )
        candidates = [candidate.to_dict() for candidate in (result.candidates or [])]
        best = result.best_match.to_dict() if result.best_match else None
        return DedupResponse.model_validate(
            {
                "is_duplicate": result.is_duplicate,
                "best_match": best,
                "candidates": candidates,
            }
        )

    def match(self, request: MatchRequest) -> MatchResponse:
        """Pipeline de matching semantique."""
        report = _to_report_input(request.report)
        candidates: Sequence[Candidate] = request.candidates
        result = find_matches(
            report,
            list(candidates),
            settings=self.settings,
            use_embeddings=request.use_embeddings,
        )
        return MatchResponse(
            report_type=str(result.report_type),
            matches=[MatchCandidateOut.model_validate(match.model_dump()) for match in result.matches],
            total_evaluated=result.total_evaluated,
        )

    def moderate(self, request: ModerationRequest) -> ModerationResponse:
        """Pipeline de fiabilite et moderation."""
        report = _to_report_input(request.report)
        result: TrustAssessment = assess_report(
            report,
            category=request.category,
            context=request.context,
            confirmations=request.confirmations,
            reactions_total=request.reactions_total,
            has_photo=request.has_photo,
            use_embeddings=request.use_embeddings,
        )
        return ModerationResponse(
            score=result.score,
            badge=result.badge,
            priority_queue=result.priority_queue,
            flags=result.flags,
            signals=result.signals,
            recommendation=result.recommendation,
        )

    def run_pipeline(self, request: PipelineRequest) -> PipelineResponse:
        """Execute dedup -> classify -> match -> moderation dans l'ordre."""
        report_payload = request.report
        report = _to_report_input(report_payload)

        dedup_response = self.deduplicate(
            DedupRequest(
                report=report_payload,
                existing_reports=request.existing_reports,
                use_embeddings=request.use_embeddings,
            )
        )

        classification = self.classify(
            ClassifyRequest(
                description=report_payload.description,
                zone=report_payload.zone,
                location=report_payload.location,
                metadata=report_payload.metadata,
                context=request.context,
                use_embeddings=request.use_embeddings,
            )
        )

        match_response = self.match(
            MatchRequest(
                report=report_payload,
                candidates=request.candidates,
                use_embeddings=request.use_embeddings,
            )
        )

        moderation = self.moderate(
            ModerationRequest(
                report=report_payload,
                category=classification.category,
                context=request.context,
                confirmations=request.confirmations,
                reactions_total=request.reactions_total,
                has_photo=request.has_photo,
                use_embeddings=request.use_embeddings,
            )
        )

        logger.info(
            "pipeline_completed",
            is_duplicate=dedup_response.is_duplicate,
            category=classification.category,
            matches=len(match_response.matches),
            trust_score=moderation.score,
        )

        return PipelineResponse(
            classification=classification,
            dedup=dedup_response,
            matches=match_response,
            moderation=moderation,
        )


def get_service(settings: Settings | None = None) -> AIService:
    """Retourne une instance du service IA."""
    return AIService(settings)


def existing_from_payloads(items: list[ExistingReportPayload]) -> list[tuple[str, ReportInput]]:
    """Convertit des payloads existants en paires (id, entite)."""
    return [(item.report_id, _to_report_input(item)) for item in items]