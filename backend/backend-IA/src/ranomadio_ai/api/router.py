"""Routeur racine de l'API IA (prefixe /api/ai)."""

from fastapi import APIRouter

from ranomadio_ai.api.routes import classify, health, matching

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(classify.router)
api_router.include_router(matching.router)

__all__ = ["api_router"]