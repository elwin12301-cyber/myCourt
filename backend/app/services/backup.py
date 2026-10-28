"""Logical backup and restore (research D12): a JSON archive of every workspace table, audit chain included.
Physical backups with pg_dump are described in docs/backend-operations.md."""
from datetime import date, datetime

from sqlalchemy import Date, func, select, text
from sqlalchemy.orm import Session

from ..models import accounts, audit, workspace
from ..models.base import UTCDateTime

FORMAT = 1
MODELS = [
    accounts.Person, workspace.Matter, workspace.Assignment, workspace.Conversation, workspace.Message, workspace.Task,
    workspace.CalendarEntry, workspace.Document, workspace.VoiceNote, workspace.DraftItem, workspace.DraftApproval,
    workspace.IntakeRecord, workspace.TimeEntry, workspace.Invoice, audit.AuditEntry,
]


def export_archive(db: Session) -> dict:
    tables: dict[str, list[dict]] = {}
    for model in MODELS:
        order = list(model.__table__.primary_key.columns)
        rows = []
        for obj in db.scalars(select(model).order_by(*order)):
            row = {}
            for col in model.__table__.columns:
                v = getattr(obj, col.name)
                row[col.name] = v.isoformat() if isinstance(v, (datetime, date)) else v
            rows.append(row)
        tables[model.__tablename__] = rows
    return {"format": FORMAT, "tables": tables}


def is_empty(db: Session) -> bool:
    return all(not db.scalar(select(func.count()).select_from(m)) for m in (accounts.Person, workspace.Matter, audit.AuditEntry))


def import_archive(db: Session, archive: dict) -> dict[str, int]:
    if archive.get("format") != FORMAT:
        raise ValueError("Unsupported archive format.")
    if not is_empty(db):
        raise ValueError("Import refused: the database already holds workspace data.")
    counts: dict[str, int] = {}
    for model in MODELS:
        rows = archive["tables"].get(model.__tablename__, [])
        parsed = []
        for row in rows:
            out = {}
            for col in model.__table__.columns:
                v = row.get(col.name)
                if v is not None and isinstance(col.type, UTCDateTime):
                    v = datetime.fromisoformat(v)
                elif v is not None and isinstance(col.type, Date):
                    v = date.fromisoformat(v)
                out[col.name] = v
            parsed.append(out)
        if parsed:
            db.execute(model.__table__.insert(), parsed)
        counts[model.__tablename__] = len(parsed)
    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT setval(pg_get_serial_sequence('audit_entry', 'seq'), COALESCE((SELECT MAX(seq) FROM audit_entry), 1))"))
    db.commit()
    return counts
