"""Enums du domaine RanoMadio, alignes sur le modele de donnees (Docs/conceptions_Eric.md)."""

from enum import StrEnum

__all__ = [
    "AvailabilityStatus",
    "Category",
    "HelpOfferStatus",
    "MatchStatus",
    "MatchType",
    "ReactionType",
    "ReportStatus",
    "ReportType",
    "TrustLevel",
    "Urgency",
    "UserRole",
    "Visibility",
]


class ReportType(StrEnum):
    """Type de signalement."""

    PROBLEM = "problem"
    NEED = "need"
    DANGER = "danger"
    RESOURCE = "resource"
    CAPACITY = "capacity"


class Category(StrEnum):
    """Categories metier, inspires des besoins de Madagascar."""

    WATER_OUTAGE = "water_outage"
    WATER_SHORTAGE = "water_shortage"
    FLOODING = "flooding"
    WASTE = "waste"
    TRANSPORT = "transport"
    HEALTH = "health"
    FOOD = "food"
    ENERGY = "energy"
    HOUSING = "housing"
    EDUCATION = "education"
    SECURITY = "security"
    OTHER = "other"


class Urgency(StrEnum):
    """Niveau d'urgence d'un signalement."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(StrEnum):
    """Statut du cycle de vie d'un signalement."""

    NEW = "new"
    CONFIRMED = "confirmed"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    EXPIRED = "expired"


class Visibility(StrEnum):
    """Niveau de visibilite d'un signalement."""

    PUBLIC = "public"
    PARTNER = "partner"
    CONFIDENTIAL = "confidential"


class AvailabilityStatus(StrEnum):
    """Disponibilite d'une ressource."""

    AVAILABLE = "available"
    LIMITED = "limited"
    UNAVAILABLE = "unavailable"
    EXPIRED = "expired"


class HelpOfferStatus(StrEnum):
    """Statut d'une offre d'aide."""

    AVAILABLE = "available"
    MATCHED = "matched"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class MatchType(StrEnum):
    """Nature d'une mise en relation."""

    NEED_RESOURCE = "need_resource"
    PROBLEM_INTERVENOR = "problem_intervenor"
    HELP_VOLUNTEER = "help_volunteer"


class MatchStatus(StrEnum):
    """Statut d'une mise en relation."""

    SUGGESTED = "suggested"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"


class ReactionType(StrEnum):
    """Reactions communautaires sur un signalement."""

    CONFIRM = "confirm"
    STILL_EXISTS = "still_exists"
    RESOLVED = "resolved"
    INCORRECT = "incorrect"
    KNOW_RESOURCE = "know_resource"
    CAN_HELP = "can_help"
    SHARE = "share"


class UserRole(StrEnum):
    """Roles utilisateurs."""

    RESIDENT = "resident"
    MODERATOR = "moderator"
    FOKONTANY = "fokontany"
    ASSOCIATION = "association"
    COMMUNE = "commune"
    PARTNER = "partner"


class TrustLevel(StrEnum):
    """Niveaux de confiance alloues a un utilisateur."""

    NEW = "new"
    ACTIVE = "active"
    VERIFIER = "verifier"
    RELIABLE = "reliable"
    VERIFIED_PARTNER = "verified_partner"