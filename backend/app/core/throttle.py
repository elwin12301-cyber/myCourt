"""Sign-in throttle (research D5): counts recent failures per account and per client address without storing either."""
from datetime import timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from . import clock
from ..config import settings
from ..models.accounts import LoginAttempt
from .errors import TooMany
from .security import keyed_hash


def _window_start():
    return clock.now() - timedelta(minutes=settings.login_window_minutes)


def check(db: Session, email: str, client: str) -> None:
    """Raises TooMany (the same answer for any account) when either the account or the address has too many failures."""
    for column, value in ((LoginAttempt.email_hash, keyed_hash(email)), (LoginAttempt.client_hash, keyed_hash(client))):
        n = db.scalar(select(func.count()).select_from(LoginAttempt).where(
            column == value, LoginAttempt.success.is_(False), LoginAttempt.time >= _window_start()))
        if n >= settings.login_max_failures:
            raise TooMany()


def record(db: Session, email: str, client: str, success: bool) -> None:
    db.add(LoginAttempt(time=clock.now(), email_hash=keyed_hash(email), client_hash=keyed_hash(client), success=success))
    db.execute(delete(LoginAttempt).where(LoginAttempt.time < clock.now() - timedelta(hours=24)))
