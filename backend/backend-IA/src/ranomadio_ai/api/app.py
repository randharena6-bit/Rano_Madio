"""Fabrique de l'application FastAPI."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from ranomadio_ai import __version__
from ranomadio_ai.api.router import api_router
from ranomadio_ai.core.config import Settings, get_settings
from ranomadio_ai.core.errors import AIError
from ranomadio_ai.core.logging import configure_logging, get_logger

__all__ = ["create_app"]

logger = get_logger(__name__)

_DESCRIPTION = """
Service IA de **RanoMadio Map** : voice du quartier.

Fonctions exposees :
- `/classify` : categorisation automatique + urgence
- `/dedup` : detection de doublons (semantique + geo + temps)
- `/matching` : mise en relation semantique besoin <-> ressource
- `/moderation` : score de fiabilite et file prioritaire
- `/extract` : pre-remplissage du formulaire depuis un texte / audio
- `/pipeline` : les quatre etapes en un seul appel
"""


def create_app(settings: Settings | None = None) -> FastAPI:
    """Construit l'application FastAPI."""
    settings = settings or get_settings()
    configure_logging(settings.log_level, json_logs=settings.is_production)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        """Precharge le modele si le chargement paresseux est desactive."""
        logger.info(
            "startup",
            environment=settings.environment,
            embedding_model=settings.embedding_model,
        )
        if not settings.embedding_lazy_load and not settings.embedding_model.startswith("mock"):
            try:
                from ranomadio_ai.ai.embeddings import warmup

                warmup()
            except AIError as exc:
                logger.warning("warmup_failed", error=exc.message)
        yield
        logger.info("shutdown")

    app = FastAPI(
        title="RanoMadio AI Service",
        description=_DESCRIPTION,
        version=__version__,
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.exception_handler(AIError)
    async def ai_error_handler(request: Request, exc: AIError) -> ORJSONResponse:
        """Convertit une erreur metier en reponse HTTP."""
        logger.warning("ai_error", path=request.url.path, code=exc.code, message=exc.message)
        return ORJSONResponse(status_code=exc.status_code, content=exc.to_dict())

    app.include_router(api_router, prefix="/api/ai")

    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        """Redirige vers la documentation."""
        return {"service": settings.app_name, "docs": "/docs", "health": "/api/ai/health"}

    return app