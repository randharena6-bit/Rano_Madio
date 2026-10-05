"""Chargement paresseux et memoisation des modeles IA.

Le service demarre sans charger de modele : le premier appel a une route IA
declenche le chargement (ou echoue proprement si sentence-transformers est absent).
"""

from functools import lru_cache
from threading import Lock
from typing import Any

from ranomadio_ai.core.config import Settings, get_settings
from ranomadio_ai.core.errors import ModelNotAvailableError
from ranomadio_ai.core.logging import get_logger

__all__ = ["clear_model_cache", "get_embedding_model", "model_status"]

logger = get_logger(__name__)

_LOCK = Lock()
_EMBEDDING_MODEL: Any = None
_LOAD_ERROR: str | None = None


@lru_cache(maxsize=4)
def _cached_model(model_name: str, cache_dir: str, device: str) -> Any:
    """Construit et met en cache le modele d'embeddings."""
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(model_name, cache_folder=cache_dir, device=device)


def get_embedding_model() -> Any:
    """Retourne le modele d'embeddings, en le chargeant au premier besoin."""
    global _EMBEDDING_MODEL, _LOAD_ERROR

    if _EMBEDDING_MODEL is not None:
        return _EMBEDDING_MODEL

    settings: Settings = get_settings()
    with _LOCK:
        if _EMBEDDING_MODEL is not None:
            return _EMBEDDING_MODEL
        try:
            device = _resolve_device(settings.embedding_device)
            logger.info(
                "loading_embedding_model", model=settings.embedding_model, device=device
            )
            _EMBEDDING_MODEL = _cached_model(
                settings.embedding_model, settings.embedding_cache_dir, device
            )
            _LOAD_ERROR = None
        except ImportError as exc:
            _LOAD_ERROR = "sentence-transformers non installe"
            raise ModelNotAvailableError(
                "Le moteur d'embeddings n'est pas installe",
                detail=f"{_LOAD_ERROR}. Lancez `uv sync --extra dev` puis `make warmup`.",
            ) from exc
        except Exception as exc:  # noqa: BLE001
            _LOAD_ERROR = str(exc)
            logger.error("embedding_model_load_failed", error=str(exc))
            raise ModelNotAvailableError(
                "Impossible de charger le modele d'embeddings",
                detail=f"{settings.embedding_model}: {exc}",
            ) from exc
    return _EMBEDDING_MODEL


def _resolve_device(requested: str) -> str:
    """Resout le device torch ('auto' -> cpu/cuda/mps)."""
    if requested != "auto":
        return requested
    try:
        import torch
    except ImportError:
        return "cpu"
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def model_status() -> dict[str, Any]:
    """Etat du modele d'embeddings pour la route /health."""
    settings = get_settings()
    return {
        "embedding_model": settings.embedding_model,
        "loaded": _EMBEDDING_MODEL is not None,
        "lazy_load": settings.embedding_lazy_load,
        "cache_dir": settings.embedding_cache_dir,
        "last_error": _LOAD_ERROR,
    }


def clear_model_cache() -> None:
    """Libere le modele charge (utile en test et en exploitation)."""
    global _EMBEDDING_MODEL, _LOAD_ERROR
    with _LOCK:
        _EMBEDDING_MODEL = None
        _LOAD_ERROR = None
    _cached_model.cache_clear()