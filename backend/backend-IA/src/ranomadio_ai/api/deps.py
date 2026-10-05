"""Dependances FastAPI."""

from functools import lru_cache

from fastapi import Depends, Header

from ranomadio_ai.core.config import Settings, get_settings
from ranomadio_ai.core.errors import AIError
from ranomadio_ai.services.ai_service import AIService, get_service

__all__ = [
    "ai_service",
    "require_api_key",
    "settings_dep",
]


def settings_dep() -> Settings:
    """Dependance injectant la configuration."""
    return get_settings()


@lru_cache(maxsize=1)
def _cached_service() -> AIService:
    """Service IA partage (le modele reste en cache global)."""
    return get_service()


def ai_service() -> AIService:
    """Dependance injectant le service IA."""
    return _cached_service()


async def require_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    settings: Settings = Depends(settings_dep),
) -> None:
    """Verifie l'en-tete X-API-Key si le service est configure pour l'exiger."""
    expected = getattr(settings, "api_key", None)
    if expected and x_api_key != expected:
        raise AIError("Cle d'API invalide")