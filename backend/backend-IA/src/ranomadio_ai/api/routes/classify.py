"""Routes de classification, dedup et extraction."""

from fastapi import APIRouter, Depends

from ranomadio_ai.ai.embeddings import cosine_matrix
from ranomadio_ai.ai.extraction import extract_from_audio, extract_from_text
from ranomadio_ai.api.deps import ai_service
from ranomadio_ai.core.logging import get_logger
from ranomadio_ai.domain.taxonomy import CATEGORY_LABELS, DEFAULT_ZONES
from ranomadio_ai.schemas.api import (
    ClassifyRequest,
    ClassifyResponse,
    DedupRequest,
    DedupResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    ExtractRequest,
    ExtractResponse,
    PipelineRequest,
    PipelineResponse,
    SimilarityRequest,
    SimilarityResponse,
)
from ranomadio_ai.services.ai_service import AIService

router = APIRouter(tags=["classification"])
logger = get_logger(__name__)


@router.post(
    "/classify",
    response_model=ClassifyResponse,
    summary="Categoriser un signalement",
)
async def classify(
    request: ClassifyRequest,
    service: AIService = Depends(ai_service),
) -> ClassifyResponse:
    """Propose categorie, urgence, tags et zone pour une description libre."""
    result = service.classify(request)
    logger.info("classified", category=result.category, confidence=result.confidence)
    return result


@router.post("/categories", summary="Taxonomie des categories")
async def categories() -> dict[str, str]:
    """Retourne le dictionnaire des categories et leurs libelles."""
    return dict(CATEGORY_LABELS)


@router.get("/zones", summary="Zones de reference")
async def zones() -> dict[str, list[str]]:
    """Retourne les zones utilisees pour l'extraction et la geo-dedup."""
    return {"zones": list(DEFAULT_ZONES)}


@router.post("/dedup", response_model=DedupResponse, summary="Detecter les doublons")
async def dedup(
    request: DedupRequest,
    service: AIService = Depends(ai_service),
) -> DedupResponse:
    """Combine similarite semantique, distance et anciennete pour detecter les doublons."""
    return service.deduplicate(request)


@router.post("/embeddings", response_model=EmbeddingResponse, summary="Generer des embeddings")
async def embeddings(request: EmbeddingRequest) -> EmbeddingResponse:
    """Retourne les vecteurs normalises d'une liste de textes."""
    import numpy as np

    from ranomadio_ai.ai.embeddings import embed

    vectors = embed(request.texts)
    return EmbeddingResponse(
        dimension=int(vectors.shape[1]),
        vectors=[[float(value) for value in row] for row in np.asarray(vectors)],
    )


@router.post("/similarity", response_model=SimilarityResponse, summary="Similarite entre deux textes")
async def similarity(request: SimilarityRequest) -> SimilarityResponse:
    """Retourne la similarite cosine entre deux descriptions."""
    from ranomadio_ai.ai.embeddings import similarity as cosine_similarity

    if request.use_embeddings:
        value = cosine_similarity(request.text_a, request.text_b)
    else:
        from ranomadio_ai.utils.text import jaccard_similarity

        value = jaccard_similarity(request.text_a, request.text_b)
    return SimilarityResponse(similarity=round(value, 4))


@router.post("/batch-similarity", summary="Similarite d'un texte vs plusieurs")
async def batch_similarity(request: EmbeddingRequest) -> list[float]:
    """Utilitaire interne : similarite du premier texte avec les suivants."""
    if len(request.texts) < 2:
        return []
    scores = cosine_matrix(request.texts[0], request.texts[1:])
    return [round(score, 4) for score in scores]


@router.post("/extract", response_model=ExtractResponse, summary="Extraire les champs d'un texte")
async def extract_text(request: ExtractRequest) -> ExtractResponse:
    """Pre-remplit le formulaire depuis un texte libre ou une transcription."""
    result = extract_from_text(request.text, known_zones=DEFAULT_ZONES)
    return ExtractResponse(
        description=result.description,
        zone=result.zone,
        nb_persons=result.nb_persons,
        duration_hint=result.duration_hint,
        keywords=result.keywords,
        language=result.language,
    )


@router.post("/extract-audio", response_model=ExtractResponse, summary="Transcrire et extraire un audio")
async def extract_audio(path: str, zone_hint: str | None = None) -> ExtractResponse:
    """Transcrit un fichier audio puis en extrait les champs (necessite faster-whisper)."""
    zones = (zone_hint, *DEFAULT_ZONES) if zone_hint else DEFAULT_ZONES
    result = extract_from_audio(path, known_zones=zones)
    return ExtractResponse(
        description=result.description,
        zone=result.zone,
        nb_persons=result.nb_persons,
        duration_hint=result.duration_hint,
        keywords=result.keywords,
        language=result.language,
    )


@router.post("/pipeline", response_model=PipelineResponse, summary="Pipeline IA complet")
async def pipeline(
    request: PipelineRequest,
    service: AIService = Depends(ai_service),
) -> PipelineResponse:
    """Execute dedup, classification, matching et moderation en un appel."""
    return service.run_pipeline(request)