import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, declared_attr, mapped_column
from sqlalchemy.types import TypeDecorator

from ..core import clock
from ..core.errors import Conflict


class UTCDateTime(TypeDecorator):
    """Stores naive UTC (works the same on PostgreSQL and SQLite) and always returns timezone-aware UTC."""
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        return value

    def process_result_value(self, value, dialect):
        return None if value is None else value.replace(tzinfo=timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class IdMixin:
    """UUID key (never a counter, so ids cannot be guessed), optimistic-concurrency version and timestamps.

    `version` is managed by SQLAlchemy's version counter: every UPDATE is `... WHERE version = <the one we read>`, so
    two simultaneous edits cannot both win. The loser gets StaleDataError, which the API turns into a 409."""
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, default=clock.now)
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime, default=clock.now, onupdate=clock.now)

    @declared_attr.directive
    def __mapper_args__(cls):
        return {"version_id_col": cls.version}


def check_version(obj: IdMixin, sent: int) -> None:
    """Edits must send the version they read; a mismatch changes nothing (FR-010)."""
    if sent != obj.version:
        raise Conflict(current_version=obj.version)


def bump(obj: IdMixin) -> None:
    """Kept for readability at call sites: the version is incremented by the database layer, not here."""
    return None
