"""Append-only audit trail. Database triggers reject UPDATE and DELETE (research D7).

`matter_id` is a plain string, not a foreign key, so deleting a matter never deletes its history.
"""
from datetime import datetime

from sqlalchemy import Integer, String, event, text
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base
from .base import UTCDateTime


class AuditEntry(Base):
    __tablename__ = "audit_entry"
    seq: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(String(36), unique=True)
    time: Mapped[datetime] = mapped_column(UTCDateTime)
    person_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    matter_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(20))
    target_type: Mapped[str] = mapped_column(String(30), default="")
    target_id: Mapped[str] = mapped_column(String(64), default="")
    detail: Mapped[str] = mapped_column(String(200), default="")
    prev_hash: Mapped[str] = mapped_column(String(64), default="")
    hash: Mapped[str] = mapped_column(String(64))


_SQLITE = [
    "CREATE TRIGGER IF NOT EXISTS audit_entry_no_update BEFORE UPDATE ON audit_entry BEGIN SELECT RAISE(ABORT, 'audit_entry is append-only'); END",
    "CREATE TRIGGER IF NOT EXISTS audit_entry_no_delete BEFORE DELETE ON audit_entry BEGIN SELECT RAISE(ABORT, 'audit_entry is append-only'); END",
]
_POSTGRES = [
    "CREATE OR REPLACE FUNCTION audit_entry_block() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'audit_entry is append-only'; END; $$ LANGUAGE plpgsql",
    "DROP TRIGGER IF EXISTS audit_entry_no_change ON audit_entry",
    "CREATE TRIGGER audit_entry_no_change BEFORE UPDATE OR DELETE ON audit_entry FOR EACH ROW EXECUTE FUNCTION audit_entry_block()",
]


def install_triggers(connection) -> None:
    statements = _POSTGRES if connection.dialect.name == "postgresql" else _SQLITE
    for s in statements:
        connection.execute(text(s))


def triggers_present(connection) -> bool:
    if connection.dialect.name == "postgresql":
        return bool(connection.execute(text("SELECT 1 FROM pg_trigger WHERE tgname = 'audit_entry_no_change'")).first())
    rows = connection.execute(text("SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'audit_entry'")).all()
    return {r[0] for r in rows} >= {"audit_entry_no_update", "audit_entry_no_delete"}


@event.listens_for(AuditEntry.__table__, "after_create")
def _after_create(target, connection, **kw):
    install_triggers(connection)
