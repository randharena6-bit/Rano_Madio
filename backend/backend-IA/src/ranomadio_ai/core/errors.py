"""Erreurs metier du service IA."""

__all__ = [
    "AIError",
    "ConfigError",
    "InferenceError",
    "ModelNotAvailableError",
    "NotFoundError",
    "ValidationError",
]


class AIError(Exception):
    """Erreur de base du service IA."""

    code = "ai_error"
    status_code = 500

    def __init__(self, message: str, *, detail: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.detail = detail

    def to_dict(self) -> dict[str, str]:
        """Serialise l'erreur pour la reponse HTTP."""
        payload: dict[str, str] = {"code": self.code, "message": self.message}
        if self.detail:
            payload["detail"] = self.detail
        return payload


class ConfigError(AIError):
    """Configuration manquante ou invalide."""

    code = "config_error"
    status_code = 500


class ModelNotAvailableError(AIError):
    """Le modele IA n'est pas installe ou n'a pas pu etre charge."""

    code = "model_unavailable"
    status_code = 503


class InferenceError(AIError):
    """Echec pendant l'inference."""

    code = "inference_error"
    status_code = 500


class ValidationError(AIError):
    """Donnees d'entree invalides."""

    code = "validation_error"
    status_code = 422


class NotFoundError(AIError):
    """Ressource introuvable."""

    code = "not_found"
    status_code = 404