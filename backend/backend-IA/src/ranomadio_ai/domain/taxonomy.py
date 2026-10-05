"""Taxonomie metier : categories, mots-cles et zones de reference."""

from types import MappingProxyType

from ranomadio_ai.domain.enums import Category

__all__ = [
    "CATEGORY_KEYWORDS",
    "CATEGORY_LABELS",
    "DEFAULT_ZONES",
    "URGENCY_KEYWORDS",
    "URGENCY_WEIGHTS",
    "keywords_for",
]

# Libelles affichables (a cozinhaer cote frontend)
CATEGORY_LABELS: MappingProxyType[str, str] = MappingProxyType(
    {
        Category.WATER_OUTAGE: "Panne d'eau",
        Category.WATER_SHORTAGE: "Manque d'eau",
        Category.FLOODING: "Inondation",
        Category.WASTE: "Dechets",
        Category.TRANSPORT: "Transport",
        Category.HEALTH: "Sante",
        Category.FOOD: "Nourriture",
        Category.ENERGY: "Electricite",
        Category.HOUSING: "Logement",
        Category.EDUCATION: "Education",
        Category.SECURITY: "Securite",
        Category.OTHER: "Autre",
    }
)

# Mots-cles normalises -> categories. Inclus les termes malgaches courants.
CATEGORY_KEYWORDS: MappingProxyType[Category, frozenset[str]] = MappingProxyType(
    {
        Category.WATER_OUTAGE: frozenset(
            {
                "panne", "pannes", "pompe", "pompes", "pompe en panne", "pas d'eau",
                "eau coupée", "eau coupee", "coupure eau", "pas d'eau depuis",
                "arrêt eau", "arret eau", "eau disparue", "borne fontaine",
                "fontaine", "puits", "puits en panne",
            }
        ),
        Category.WATER_SHORTAGE: frozenset(
            {
                "besoin eau", "besoin d'eau", "manque d'eau", "eau insuffisante",
                "quelques bidons", "bidons", "eau potable", "pas assez d'eau",
            }
        ),
        Category.FLOODING: frozenset(
            {
                "inondation", "inonde", "innondation", "inondé", "eaux montent",
                "eau monte", "submersion", "dégât des eaux", "digat", "digue",
            }
        ),
        Category.WASTE: frozenset(
            {
                "dechet", "dechets", "déchets", "ordure", "ordures", "poubelle",
                "poubelles", "accumulation", "sale", "proppreté", "propreté",
                "nettoyage", "encombrement",
            }
        ),
        Category.TRANSPORT: frozenset(
            {
                "transport", "camion", "camions", "taxi", "taxis", "voiture",
                "vehicule", "véhicule", "route coupée", "route coupee", "pont",
                "embouteillage", "bousculade",
            }
        ),
        Category.HEALTH: frozenset(
            {
                "sante", "santé", "malade", "malades", "hopital", "hôpital",
                "clinique", "infirmier", "infirmière", "médicament", "medicament",
                "école", "ecole", "enfant malade", "grossesse", "vaccin",
            }
        ),
        Category.FOOD: frozenset(
            {"nourriture", "manger", "repas", "food", "riz", "huile", "distribution"},
        ),
        Category.ENERGY: frozenset(
            {
                "electricite", "électricité", "électricité", "coupure courant",
                "delapanneur", "délapanneur", "groupage", "panne courant",
            }
        ),
        Category.HOUSING: frozenset(
            {"logement", "maison", "toit", "toit effondré", "mur", "effondrement"},
        ),
        Category.EDUCATION: frozenset(
            {"école", "ecole", "ecolier", "écolier", "classe", "professeur", "etudiant"},
        ),
        Category.SECURITY: frozenset(
            {"sécurité", "securite", "vol", "voleur", "agression", "danger", "incendie"},
        ),
        Category.OTHER: frozenset(),
    }
)

# TermesUsed comme signaux d'urgence forte.
URGENCY_KEYWORDS: MappingProxyType[tuple[str, ...], str] = MappingProxyType(
    {
        ("urgent", "urgence", "urgent", "immediatement", "immédiatement"): "high",
        ("vie", "mort", "mortel", "danger", "dangereux", "critique", "critique"): "critical",
        ("bebe", "bébé", "enfant", "personne âgée", "personne agee"): "high",
    }
)

# Poids pour convertir un score de regles en urgence.
URGENCY_WEIGHTS: MappingProxyType[str, float] = MappingProxyType(
    {"low": 0.0, "medium": 0.34, "high": 0.67, "critical": 1.0}
)

# Fokontany / quartiers courants d'Antananarivo (donnees de demo).
DEFAULT_ZONES: tuple[str, ...] = (
    "Anosizato",
    "Anbohimanarina",
    "Andoharanofotsy",
    "Ankadivato",
    "Tsaralalana",
    "Soa",
    "Itaosy",
    "Mahamasina",
    "Antaninandro",
    "Andravoahangy",
)


def keywords_for(category: Category) -> frozenset[str]:
    """Retourne les mots-cles rattaches a une categorie."""
    return CATEGORY_KEYWORDS.get(category, frozenset())