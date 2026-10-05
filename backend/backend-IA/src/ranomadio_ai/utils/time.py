"""Helpers de temps."""

from datetime import UTC, datetime, timedelta

__all__ = ["age_hours", "hours_since", "utcnow", "within_window"]


def utcnow() -> datetime:
    """Retourne l'heure courante en UTC."""
    return datetime.now(UTC)


def age_hours(timestamp: datetime) -> float:
    """Age en heures d'un timestamp."""
    return (utcnow() - timestamp).total_seconds() / 3600


def hours_since(timestamp: datetime | None) -> float | None:
    """Age en heures, ou None si timestamp absent."""
    return None if timestamp is None else age_hours(timestamp)


def within_window(timestamp: datetime, window_hours: int) -> bool:
    """Vrai si le timestamp est plus recent que la fenetre."""
    return age_hours(timestamp) <= window_hours


def as_utc(timestamp: datetime) -> datetime:
    """Force le fuseau UTC sur un timestamp naif."""
    return timestamp if timestamp.tzinfo else timestamp.replace(tzinfo=UTC)


def add_hours(hours: int) -> datetime:
    """Timestamp dans `hours` heures."""
    return utcnow() + timedelta(hours=hours)