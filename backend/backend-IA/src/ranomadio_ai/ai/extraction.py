"""Transcription audio et extraction d'entites (phase V1).

L'extraire `faster-whisper` est optionnel : sans lui, l'API accepte du texte
deja transcrit. Cette couche prepare le pipeline audio -> formulaire.
"""

from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

from ranomadio_ai.core.config import get_settings
from ranomadio_ai.core.errors import ModelNotAvailableError
from ranomadio_ai.core.logging import get_logger
from ranomadio_ai.domain.entities import ReportInput
from ranomadio_ai.utils.text import extract_mentioned_zones, extract_numbers

__all__ = ["ExtractionResult", "extract_from_audio", "extract_from_text", "is_audio_enabled"]

logger = get_logger(__name__)


@dataclass(slots=True)
class ExtractionResult:
    """Champs pre-remplis a partir d'un audio ou d'un texte libre."""

    description: str
    zone: str | None = None
    nb_persons: int | None = None
    duration_hint: str | None = None
    keywords: list[str] = field(default_factory=list)
    language: str | None = None


def is_audio_enabled() -> bool:
    """Vrai si faster-whisper est installe."""
    try:
        import faster_whisper  # noqa: F401
    except ImportError:
        return False
    return True


@lru_cache(maxsize=1)
def _whisper_model() -> Any:
    """Charge le modele Whisper (une seule fois)."""
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise ModelNotAvailableError(
            "La transcription audio n'est pas installee",
            detail="Lancez `uv sync --extra audio`.",
        ) from exc

    settings = get_settings()
    logger.info("loading_whisper_model", model=settings.whisper_model)
    return WhisperModel(settings.whisper_model, device="auto", compute_type="int8")


def transcribe(audio_path: str) -> tuple[str, str | None]:
    """Transcrit un fichier audio en texte. Retourne (texte, langue)."""
    settings = get_settings()
    segments, info = _whisper_model().transcribe(
        audio_path,
        language=settings.whisper_language,
        task="transcribe",
        vad_filter=True,
    )
    text = " ".join(segment.text.strip() for segment in segments).strip()
    return text, getattr(info, "language", None)


def extract_from_audio(
    audio_path: str,
    *,
    known_zones: tuple[str, ...] = (),
) -> ExtractionResult:
    """Transcrit un audio puis en extrait les champs cles."""
    text, language = transcribe(audio_path)
    result = extract_from_text(text, known_zones=known_zones)
    result.language = language
    return result


_DURATION_HINTS: dict[str, tuple[str, ...]] = {
    "depuis ce matin": ("ce matin", "depuis ce matin", "depuis le matin"),
    "depuis hier": ("hier", "depuis hier", "la nuit derniere", "nuit derniere"),
    "ce soir": ("ce soir", "le soir", "ce soir la"),
    "plusieurs jours": ("plusieurs jours", "depuis plusieurs jours", "semaine", "jours"),
}


def extract_from_text(
    text: str,
    *,
    known_zones: tuple[str, ...] = (),
) -> ExtractionResult:
    """Extrait zone, nombre de personnes et duree d'un texte libre."""
    from ranomadio_ai.domain.rules import normalize_text

    normalized = normalize_text(text)
    zones = extract_mentioned_zones(normalized, known_zones)
    numbers = extract_numbers(normalized)

    duration: str | None = None
    for hint, markers in _DURATION_HINTS.items():
        if any(marker in normalized for marker in markers):
            duration = hint
            break

    return ExtractionResult(
        description=" ".join(text.split()),
        zone=zones[0] if zones else None,
        nb_persons=max(numbers) if numbers else None,
        duration_hint=duration,
        keywords=list(zones),
        language=None,
    )


def to_report_input(
    extraction: ExtractionResult,
    *,
    location: Any = None,
    from_audio: bool = True,
) -> ReportInput:
    """Convertit une extraction en `ReportInput` exploitable par les pipelines."""
    metadata: dict[str, object] = {"from_audio": from_audio}
    if extraction.nb_persons:
        metadata["nb_persons"] = extraction.nb_persons
    if extraction.duration_hint:
        metadata["duration_hint"] = extraction.duration_hint
    return ReportInput(
        description=extraction.description,
        location=location,
        zone=extraction.zone,
        metadata=metadata,
    )