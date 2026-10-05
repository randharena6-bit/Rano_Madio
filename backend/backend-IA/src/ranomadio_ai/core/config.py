"""Configuration applicative, chargee depuis l'environnement et du fichier .env."""

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

__all__ = ["Settings", "get_settings"]


class Settings(BaseSettings):
    """Parametres du service IA."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Serveur
    app_name: str = "ranomadio-ia"
    environment: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = Field(default_factory=list)
    api_key: str | None = None

    # Modeles IA
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_cache_dir: str = "./data/models"
    embedding_device: str = "auto"
    embedding_lazy_load: bool = True
    whisper_model: str = "base"
    whisper_language: str = "fr"

    # Seuils metier
    dedup_max_distance_m: int = 200
    dedup_max_age_hours: int = 6
    dedup_min_similarity: float = 0.82
    match_min_semantic_score: float = 0.45
    match_max_distance_m: int = 5000
    match_top_k: int = 5

    # Donnees
    database_url: str | None = None
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    embedding_cache_ttl_seconds: int = 3600

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        """Accepte une liste JSON ou une chaine comma-separee."""
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return []
            if stripped.startswith("["):
                return value
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        """Vrai si l'environnement est declare comme production."""
        return self.environment.lower() in {"prod", "production"}

    @property
    def has_database(self) -> bool:
        """Vrai si une base de donnees est configuree."""
        return self.database_url is not None and "://" in self.database_url

    @property
    def has_supabase(self) -> bool:
        """Vrai si Supabase est configure."""
        return bool(self.supabase_url and self.supabase_service_role_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Retourne les parametres applicatifs (memoises)."""
    return Settings()