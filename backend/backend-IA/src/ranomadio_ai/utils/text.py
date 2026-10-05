"""Helpers texte : similarite de Jaccard, detection de spam, extraction d'entites."""

import re
from collections import Counter

from ranomadio_ai.domain.rules import normalize_text

__all__ = [
    "STOPWORDS",
    "extract_numbers",
    "jaccard_similarity",
    "looks_repetitive",
    "extract_mentioned_zones",
]

STOPWORDS: frozenset[str] = frozenset(
    {
        "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "a", "au",
        "aux", "en", "sur", "pour", "par", "avec", "sans", "dans", "ce", "cet",
        "cette", "ces", "il", "elle", "ils", "elles", "je", "nous", "vous", "ils",
        "on", "y", "ne", "pas", "plus", "que", "qui", "quoi", "dont", "si",
        "est", "sont", "ete", "etait", "sera", "a", "aujourdhui", "hier", "demain",
        "matin", "soir", "nuit", "jour", "jours", "heure", "heures", "ici", "la",
    }
)

_ZONE_RE = re.compile(
    r"\b("
    r"anosizato|anbohimanarina|andoharanofotsy|ankadivato|tsaralalana|"
    r"itaosy|mahamasina|antaninandro|andravoahangy|analakely|ambohidratrimo|"
    r"ivandry|toamasina|antananarivo|anjoma|fianarantsoa|mahajanga|toamasina"
    r")\b",
    re.IGNORECASE,
)

_NUMBER_RE = re.compile(r"\b(\d{1,6})\b")


def jaccard_similarity(left: str, right: str) -> float:
    """Similarite de Jaccard sur les ensembles de tokens significatifs."""
    left_tokens = set(normalize_text(left).split()) - STOPWORDS
    right_tokens = set(normalize_text(right).split()) - STOPWORDS
    if not left_tokens and not right_tokens:
        return 1.0
    if not left_tokens or not right_tokens:
        return 0.0
    union = left_tokens | right_tokens
    return round(len(left_tokens & right_tokens) / len(union), 4)


def looks_repetitive(text: str) -> bool:
    """Vrai si le texte montre un motif repetitif typique du spam."""
    tokens = normalize_text(text).split()
    if len(tokens) < 6:
        return False
    counts = Counter(tokens)
    most_common_ratio = counts.most_common(1)[0][1] / len(tokens)
    return most_common_ratio > 0.5


def extract_mentioned_zones(text: str, known_zones: tuple[str, ...] = ()) -> tuple[str, ...]:
    """Detecte les zones (fokontany/quartiers) citees dans un texte."""
    normalized = normalize_text(text)
    found: set[str] = set()

    for zone in known_zones:
        if normalize_text(zone) in normalized:
            found.add(zone)

    for match in _ZONE_RE.findall(normalized):
        found.add(match.lower())

    return tuple(sorted(found))


def extract_numbers(text: str) -> tuple[int, ...]:
    """Extrait les nombres entiers d'un texte (nb de personnes, quantites)."""
    return tuple(int(value) for value in _NUMBER_RE.findall(normalize_text(text)))