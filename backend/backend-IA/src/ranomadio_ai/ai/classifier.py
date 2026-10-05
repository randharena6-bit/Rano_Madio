"""Classification automatique des signalements.

Combine un classifieur semantique (embeddings vs prototypes de categories)
et un score lexical. En mode degrade (embeddings indisponibles), les regles
lexicales de `domain.rules` prennent le relais.
"""

from dataclasses import dataclass, field
from typing import Any

from ranomadio_ai.ai.embeddings import cosine_matrix
from ranomadio_ai.domain.entities import ReportInput, UserContext
from ranomadio_ai.domain.enums import Category, Urgency
from ranomadio_ai.domain.rules import (
    confidence_to_score,
    suggest_category,
    suggest_urgency,
)
from ranomadio_ai.domain.taxonomy import CATEGORY_LABELS

__all__ = ["ClassificationResult", "classify_report", "category_prototypes"]


@dataclass(slots=True)
class ClassificationResult:
    """Sortie du classifieur."""

    category: Category
    category_label: str
    urgency: Urgency
    confidence: float
    score: int
    suggested_tags: list[str] = field(default_factory=list)
    suggested_zone: str | None = None
    extracted_entities: dict[str, Any] = field(default_factory=dict)
    method: str = "rules"


_CATEGORY_PROTOTYPES: dict[Category, tuple[str, ...]] = {
    Category.WATER_OUTAGE: (
        "panne de pompe a eau, plus d'eau depuis ce matin",
        "la borne fontaine est hors service, pas d'eau dans le quartier",
        "coupure d'eau generalisee, le puits est en panne",
    ),
    Category.WATER_SHORTAGE: (
        "besoin d'eau potable pour plusieurs familles, nous n'avons plus de bidons",
        "il manque de l'eau, les containers sont vides",
        "nous avons besoin de Quelques bidons d'eau pour boire",
    ),
    Category.FLOODING: (
        "inondation dans la rue, l'eau monte et entre dans les maisons",
        "les eaux debordent apres la pluie, digat casse",
        "quartier submerge, les gens doivent se deplacer en barque",
    ),
    Category.WASTE: (
        "accumulation de dechets et ordures dans la rue",
        "la poubelle deborde, il faut nettoyer",
        "proprete du quartier, trop d'ordures accumulees",
    ),
    Category.TRANSPORT: (
        "besoin d'un camion pour transporter des sacs",
        "route coupee, pas de moyen de transport",
        "il faut un vehicule pour evacuer les personnes",
    ),
    Category.HEALTH: (
        "personne malade a besoin d'un transport vers l'hopital",
        "besoin de medicaments pour un enfant",
        "urgence medicale, une femme enceinte doit etre amenee aux soins",
    ),
    Category.FOOD: (
        "distribution de nourriture et de vivres",
        "nous n'avons rien a manger pour ce soir",
        "besoin de repas pour les familles",
    ),
    Category.ENERGY: (
        "coupure d'electricite dans le quartier",
        "le courant est coupe depuis plusieurs heures",
        "probleme d'electricite et de delapanneur",
    ),
    Category.HOUSING: (
        "toit effondre, besoin d'abri",
        "maison en mauvais etat apres les pluies",
        "besoin de logement d'urgence",
    ),
    Category.EDUCATION: (
        "l'ecole est inaccessible a cause de l'eau",
        "besoin de soutien scolaire pour les eleves",
        "salle de classe inondée",
    ),
    Category.SECURITY: (
        "situation dangereuse, risque d'incendie",
        "vol et agression dans le quartier",
        "zone non securisee la nuit",
    ),
    Category.OTHER: (
        "probleme non identifie dans le quartier",
        "signalement general sans precision",
        "autre situation a signaler",
    ),
}


def category_prototypes(category: Category) -> tuple[str, ...]:
    """Textes prototypes servant de reference au classifieur semantique."""
    return _CATEGORY_PROTOTYPES.get(category, ())


def _tag_rules(text: str) -> list[str]:
    """Derive des tags simples (lieux, duree, volume) depuis le texte."""
    normalized = text.lower()
    tags: list[str] = []

    for marker, tag in (
        ("pompe", "pompe"),
        ("puits", "puits"),
        ("fontaine", "borne fontaine"),
        ("ecole", "ecole"),
        ("hopital", "hopital"),
        ("clinique", "clinique"),
        ("dechet", "dechets"),
        ("ordure", "ordures"),
        ("camion", "camion"),
        ("bidon", "bidons"),
        ("inondation", "inondation"),
    ):
        if marker in normalized:
            tags.append(tag)

    if "matin" in normalized:
        tags.append("depuis ce matin")
    if "nuit" in normalized or "soir" in normalized:
        tags.append("ce soir")

    return sorted(set(tags))


def _lexical_confidence(text: str, category: Category, lexical: tuple[Category, float]) -> float:
    """Combine score lexical et correspondance de la categorie retenue."""
    from ranomadio_ai.domain.rules import has_category_keyword, normalize_text

    normalized = normalize_text(text)
    lexical_cat, lexical_conf = lexical
    if lexical_cat is category and has_category_keyword(normalized, category):
        return round(min(1.0, 0.5 + lexical_conf / 2), 4)
    return round(lexical_conf / 2, 4) if lexical_cat is category else 0.3


def classify_report(
    report: ReportInput,
    *,
    context: UserContext | None = None,
    use_embeddings: bool = True,
    known_zones: tuple[str, ...] = (),
) -> ClassificationResult:
    """Classe un signalement : categorie, urgence, tags et entites."""
    from ranomadio_ai.utils.text import extract_mentioned_zones, extract_numbers

    lexical_cat, lexical_conf = suggest_category(report.description)
    semantic_cat = None
    semantic_scores: dict[Category, float] = {}

    if use_embeddings:
        try:
            candidates: list[str] = []
            index_map: list[Category] = []
            for category, prototypes in _CATEGORY_PROTOTYPES.items():
                for prototype in prototypes:
                    candidates.append(prototype)
                    index_map.append(category)
            scores = cosine_matrix(report.description, candidates)
            per_category: dict[Category, list[float]] = {}
            for category, score in zip(index_map, scores, strict=True):
                per_category.setdefault(category, []).append(score)
            semantic_scores = {
                category: round(sum(values) / len(values), 4)
                for category, values in per_category.items()
            }
            if semantic_scores:
                semantic_cat = max(semantic_scores, key=lambda key: semantic_scores[key])
        except Exception:  # noqa: BLE001
            semantic_cat = None

    if semantic_cat is not None:
        category = semantic_cat
        semantic_conf = semantic_scores.get(semantic_cat, 0.0)
        confidence = _lexical_confidence(
            report.description,
            category,
            (lexical_cat, lexical_conf),
        )
        if lexical_cat is category:
            confidence = round(min(1.0, confidence + 0.2), 4)
        confidence = round(max(semantic_conf * 0.7, confidence), 4)
        method = "semantic+lexical"
    else:
        category = lexical_cat
        confidence = round(max(lexical_conf, 0.3), 4)
        method = "lexical"

    urgency, urgency_conf = suggest_urgency(report, category=category, context=context)

    entities: dict[str, Any] = {}
    numbers = extract_numbers(report.description)
    if numbers:
        entities["numbers"] = list(numbers)
        entities["nb_persons"] = max(numbers)

    zones = extract_mentioned_zones(report.description, known_zones)
    suggested_zone = report.zone or (zones[0] if zones else None)

    final_conf = round(min(1.0, confidence * 0.7 + urgency_conf * 0.3), 4)

    return ClassificationResult(
        category=category,
        category_label=CATEGORY_LABELS.get(category, category.value),
        urgency=urgency,
        confidence=final_conf,
        score=int(confidence_to_score(final_conf)),
        suggested_tags=_tag_rules(report.description),
        suggested_zone=suggested_zone,
        extracted_entities=entities,
        method=method,
    )