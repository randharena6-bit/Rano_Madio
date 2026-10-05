"""Client Supabase pour lecture/ecriture des donnees RanoMadio.

Optionnel : le service IA fonctionne sans Supabase (schemas + rules pures).
Le client est construit paresseusement pour ne pas echouer au demarrage.
"""

from typing import Any

import httpx

from ranomadio_ai.core.config import Settings, get_settings
from ranomadio_ai.core.errors import ConfigError, NotFoundError
from ranomadio_ai.core.logging import get_logger

__all__ = ["SupabaseClient", "get_supabase"]

logger = get_logger(__name__)


class SupabaseClient:
    """Client REST minimal pour l'API PostgREST de Supabase."""

    def __init__(self, url: str, key: str, *, timeout: float = 10.0) -> None:
        self._base_url = f"{url.rstrip('/')}/rest/v1"
        self._key = key
        self._timeout = timeout

    def _headers(self, *, prefer: str | None = None) -> dict[str, str]:
        """Entetes d'authentification et de representation."""
        headers = {
            "apikey": self._key,
            "Authorization": f"Bearer {self._key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    async def select(
        self,
        table: str,
        *,
        params: dict[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        """Lit des lignes d'une table."""
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self._base_url}/{table}",
                params=params,
                headers=self._headers(),
            )
        if response.status_code == 404:
            raise NotFoundError(f"Table introuvable : {table}")
        response.raise_for_status()
        payload = response.json()
        return payload if isinstance(payload, list) else [payload]

    async def insert(self, table: str, rows: dict[str, Any] | list[dict[str, Any]]) -> Any:
        """Insere une ou plusieurs lignes."""
        body = [rows] if isinstance(rows, dict) else rows
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self._base_url}/{table}",
                json=body,
                headers=self._headers(prefer="return=representation"),
            )
        response.raise_for_status()
        return response.json()

    async def rpc(self, function_name: str, payload: dict[str, Any]) -> Any:
        """Appelle une fonction PostgreSQL exposee par PostgREST."""
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.post(
                f"{self._base_url}/rpc/{function_name}",
                json=payload,
                headers=self._headers(),
            )
        response.raise_for_status()
        return response.json()


def get_supabase(settings: Settings | None = None) -> SupabaseClient:
    """Construit un client Supabase, ou leve une erreur de configuration."""
    settings = settings or get_settings()
    if not settings.has_supabase:
        raise ConfigError(
            "Supabase non configure",
            detail="Renseignez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env",
        )
    return SupabaseClient(
        url=settings.supabase_url or "",
        key=settings.supabase_service_role_key or "",
    )