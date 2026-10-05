"""Service d'embeddings semantiques (sentence-transformers).

Fournit des vecteurs de phrases et des operations de similarite cosine.
"""

from functools import lru_cache
from typing import Any

import numpy as np

from ranomadio_ai.ai.registry import get_embedding_model
from ranomadio_ai.core.errors import InferenceError
from ranomadio_ai.core.logging import get_logger

__all__ = ["cosine_matrix", "embed", "embed_query", "similarity", "warmup"]

logger = get_logger(__name__)

_MIN_MODEL = 8
_MAX_TEXTS = 256


@lru_cache(maxsize=1024)
def embed_query(text: str) -> tuple[float, ...]:
    """Embed un texte unique, avec cache memoire."""
    vector = embed([text])[0]
    return tuple(float(value) for value in vector)


def embed(texts: list[str]) -> np.ndarray:
    """Embed une liste de textes et retourne une matrice numpy normalisee."""
    if not texts:
        return np.zeros((0, _MIN_MODEL), dtype=np.float32)

    model: Any = get_embedding_model()
    try:
        vectors = model.encode(
            texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("embedding_failed", error=str(exc), count=len(texts))
        raise InferenceError(
            "Echec de la generation des embeddings", detail=str(exc)
        ) from exc
    return np.asarray(vectors, dtype=np.float32)


def similarity(text_a: str, text_b: str) -> float:
    """Similarite cosine entre deux textes, dans [0, 1]."""
    vectors = embed([text_a, text_b])
    return float(np.clip(np.dot(vectors[0], vectors[1]), 0.0, 1.0))


def cosine_matrix(query: str, candidates: list[str]) -> list[float]:
    """Similarite cosine entre un texte et plusieurs candidats."""
    if not candidates:
        return []
    vectors = embed([query, *candidates])
    scores = vectors[0] @ vectors[1:].T
    return [float(np.clip(score, 0.0, 1.0)) for score in scores]


def warmup() -> int:
    """Precharge le modele et retourne sa dimension."""
    model = get_embedding_model()
    dimension = int(model.get_sentence_embedding_dimension())
    embed(["chauffage", "mada"])
    logger.info("embedding_model_warm", dimension=dimension)
    return dimension