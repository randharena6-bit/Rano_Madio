"""Route de sante et d'introspection du service."""

from typing import Any

from fastapi import APIRouter, Depends

from ranomadio_ai import __version__
from ranomadio_ai.ai.extraction import is_audio_enabled
from ranomadio_ai.ai.registry import model_status
from ranomadio_ai.api.deps import settings_dep
from ranomadio_ai.core.config import Settings
from ranomadio_ai.schemas.api import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Etat du service IA")
async def health(settings: Settings = Depends(settings_dep)) -> HealthResponse:
    """Retourne l'etat du service et la disponibilite des modeles."""
    models: dict[str, Any] = {
        "embeddings": model_status(),
        "whisper": {"available": is_audio_enabled(), "model": settings.whisper_model},
        "database": {"configured": settings.has_database},
        "supabase": {"configured": settings.has_supabase},
    }
    return HealthResponse(
        status="ok",
        version=__version__,
        environment=settings.environment,
        models=models,
    )


@router.get("/health/ready", summary="Prechauffage du modele")
async def ready(warm_model: bool = True) -> dict[str, Any]:
    """Declenche le chargement du modele d'embeddings (prechauffage)."""
    if not warm_model:
        return {"ready": True, "loaded": False}
    from ranomadio_ai.ai.embeddings import warmup

    dimension = warmup()
    return {"ready": True, "dimension": dimension, **model_status()}