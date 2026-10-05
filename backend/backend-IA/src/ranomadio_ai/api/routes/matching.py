"""Routes de matching semantique et de moderation."""

from fastapi import APIRouter, Depends

from ranomadio_ai.api.deps import ai_service
from ranomadio_ai.core.logging import get_logger
from ranomadio_ai.domain.entities import UserContext
from ranomadio_ai.domain.enums import Category
from ranomadio_ai.domain.taxonomy import DEFAULT_ZONES
from ranomadio_ai.schemas.api import (
    MatchRequest,
    MatchResponse,
    ModerationRequest,
    ModerationResponse,
)
from ranomadio_ai.services.ai_service import AIService

router = APIRouter(tags=["matching"])
logger = get_logger(__name__)


@router.post("/matching", response_model=MatchResponse, summary="Trouver des matchs semantiques")
async def matching(
    request: MatchRequest,
    service: AIService = Depends(ai_service),
) -> MatchResponse:
    """Propose ressources, intervenants ou volontaires pour un signalement."""
    result = service.match(request)
    logger.info("matching_done", matches=len(result.matches), evaluated=result.total_evaluated)
    return result


@router.post("/moderation", response_model=ModerationResponse, summary="Evaluer la fiabilite")
async def moderation(
    request: ModerationRequest,
    service: AIService = Depends(ai_service),
) -> ModerationResponse:
    """Retourne un score 0-100 et un badge de moderation."""
    return service.moderate(request)


@router.post("/moderation/batch", summary="Evaluer plusieurs signalements")
async def moderation_batch(
    requests: list[ModerationRequest],
    service: AIService = Depends(ai_service),
) -> list[ModerationResponse]:
    """Evalue une liste de signalements (file de priorisation du moderateur)."""
    return [service.moderate(request) for request in requests]


@router.get("/moderation/queue", summary="File prioritaire")
async def priority_queue(
    category: Category | None = None,
) -> dict[str, object]:
    """Indique les seuils de priorisation appliques par le service."""
    return {
        "verified_threshold": 60,
        "priority_threshold": 40,
        "category": category,
        "zones": list(DEFAULT_ZONES),
    }


@router.post("/explain", summary="Explication d'un score de match")
async def explain(
    report_description: str,
    candidate_description: str,
) -> dict[str, float]:
    """Retourne les composantes brutes du score pour debug / transparence."""
    from ranomadio_ai.utils.text import jaccard_similarity

    from ranomadio_ai.ai.embeddings import similarity as cosine_similarity

    semantic = cosine_similarity(report_description, candidate_description)
    lexical = jaccard_similarity(report_description, candidate_description)
    return {"semantic_score": semantic, "lexical_score": lexical}


@router.post("/demo", summary="Jeu de donnees de demonstration")
async def demo() -> dict[str, object]:
    """Retourne un exemple de payload utilisable pour integrer le frontend."""
    from ranomadio_ai.domain.entities import GeoPoint, ResourceInput
    from ranomadio_ai.domain.enums import AvailabilityStatus

    report = {
        "description": (
            "Le puits pres de l'ecole Anosizato ne marche plus depuis ce matin, "
            "on a plus d'eau pour 50 familles"
        ),
        "location": {"lat": -18.9265, "lon": 47.5123},
        "zone": "Anosizato",
    }
    resources = [
        ResourceInput(
            resource_id="res-001",
            name="Puits Association Soa",
            description="120 bidons d'eau disponibles, distribution 14h-17h",
            category=Category.WATER_OUTAGE,
            location=GeoPoint(lat=-18.9278, lon=47.5135),
            zone="Anosizato",
            quantity=120,
            availability=AvailabilityStatus.AVAILABLE,
        ).model_dump(mode="json")
    ]
    return {
        "report": report,
        "candidates": resources,
        "context": UserContext(user_id="demo", history_reports=12, history_confirmations=10).model_dump(),
    }