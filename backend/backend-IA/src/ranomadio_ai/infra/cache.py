"""Cache LRU en memoire pour les resultats IA (embeddings, scorings)."""

from collections.abc import Callable
from functools import lru_cache
from typing import Any, TypeVar

__all__ = ["cached", "cache_info", "clear_cache"]

T = TypeVar("T")


def cached(func: Callable[..., T], *, maxsize: int = 256) -> Callable[..., T]:
    """Memoise une fonction sans arguments hashables."""
    return lru_cache(maxsize=maxsize)(func)


def cache_info(func: Any) -> Any:
    """Retourne les statistiques du cache d'une fonction."""
    return func.cache_info()


def clear_cache(func: Any) -> None:
    """Vide le cache d'une fonction."""
    func.cache_clear()