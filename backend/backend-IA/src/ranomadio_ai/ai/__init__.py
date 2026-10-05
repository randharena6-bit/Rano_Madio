"""Pipelines IA du service RanoMadio.

Modules:
    registry: chargement paresseux du modele d'embeddings.
    embeddings: generation de vecteurs et similarite cosine.
    classifier: categorisation et urgence automatiques.
    dedup: detection de doublons.
    matcher: matching semantique besoin <-> ressource.
    moderation: score de fiabilite et badge de moderation.
    extraction: transcription audio et extraction d'entites.
"""

from ranomadio_ai.ai.classifier import ClassificationResult, classify_report
from ranomadio_ai.ai.dedup import DedupResult, DuplicateCandidate, find_duplicates
from ranomadio_ai.ai.embeddings import cosine_matrix, embed, similarity, warmup
from ranomadio_ai.ai.extraction import ExtractionResult, extract_from_audio, extract_from_text
from ranomadio_ai.ai.matcher import MatchCandidate, find_matches
from ranomadio_ai.ai.moderation import TrustAssessment, assess_report
from ranomadio_ai.ai.registry import clear_model_cache, get_embedding_model, model_status

__all__ = [
    "ClassificationResult",
    "DedupResult",
    "DuplicateCandidate",
    "ExtractionResult",
    "MatchCandidate",
    "TrustAssessment",
    "assess_report",
    "classify_report",
    "clear_model_cache",
    "cosine_matrix",
    "embed",
    "extract_from_audio",
    "extract_from_text",
    "find_duplicates",
    "find_matches",
    "get_embedding_model",
    "model_status",
    "similarity",
    "warmup",
]