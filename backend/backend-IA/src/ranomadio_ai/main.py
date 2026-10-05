"""Point d'entree uvicorn : `uvicorn ranomadio_ai.main:app`."""

from ranomadio_ai.api.app import create_app

app = create_app()

__all__ = ["app"]