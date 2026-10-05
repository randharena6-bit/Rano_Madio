"""Fixtures partagees : configuration de test et client HTTP in-memory."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from ranomadio_ai.api.app import create_app
from ranomadio_ai.core.config import Settings, get_settings


@pytest.fixture(scope="session")
def settings() -> Settings:
    """Configuration de test, isolee du .env local."""
    return Settings(
        environment="test",
        debug=True,
        embedding_lazy_load=True,
        cors_origins=["http://localhost:5173"],
    )


@pytest.fixture
def app(settings: Settings) -> Iterator[TestClient]:
    """Client TestClient sur une application configuree pour les tests."""
    with TestClient(create_app(settings)) as client:
        yield client


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Iterator[None]:
    """Evite que le cache de get_settings fuite entre les tests."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()