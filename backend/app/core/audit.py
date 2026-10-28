"""Writes and verifies the audit trail. The writer adds the entry to the CALLER's transaction, so a change and its
record are saved together or not at all (FR-011, FR-016)."""
import hashlib

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import clock
from ..models.audit import AuditEntry
from ..models.base import new_id
from ..models.workspace import Matter

ACTIONS = {"view", "create", "update", "delete", "export", "share", "unshare", "approve", "sign_in", "sign_out", "denied"}


def _canonical(prev: str, e: AuditEntry) -> str:
    when = e.time.strftime("%Y-%m-%dT%H:%M:%S.%f")
    return "|".join([prev, e.id, when, e.person_id or "", e.matter_id or "", e.action, e.target_type, e.target_id, e.detail])


def _hash(prev: str, e: AuditEntry) -> str:
    return hashlib.sha256(_canonical(prev, e).encode()).hexdigest()


def append_audit(session: Session, person_id: str | None, matter_id: str | None, action: str,
                 target_type: str = "", target_id: str = "", detail: str = "") -> AuditEntry:
    """`detail` is a short note about WHAT happened (for example "title changed"). It must not hold names,
    case numbers, e-mail addresses or secrets; it is cut to 200 characters."""
    if action not in ACTIONS:
        raise ValueError(f"unknown audit action {action!r}")
    prev = ""
    if matter_id:
        # Entries for one matter form a chain. Lock the MATTER row first, so concurrent writers take turns and each one
        # reads the newest entry after the previous writer committed (locking the "last entry" is not enough: a waiting
        # writer would not see a row inserted meanwhile).
        session.execute(select(Matter.id).where(Matter.id == matter_id).with_for_update())
        last = session.scalars(
            select(AuditEntry).where(AuditEntry.matter_id == matter_id).order_by(AuditEntry.seq.desc()).limit(1)
        ).first()
        prev = last.hash if last else ""
    entry = AuditEntry(id=new_id(), time=clock.now(), person_id=person_id, matter_id=matter_id, action=action,
                       target_type=target_type, target_id=target_id, detail=detail[:200], prev_hash=prev, hash="")
    entry.hash = _hash(prev, entry)
    session.add(entry)
    session.flush()
    return entry


def verify_chain(session: Session, matter_id: str) -> tuple[bool, str | None]:
    """Recomputes the chain. Returns (ok, id of the first entry that does not fit)."""
    prev = ""
    for e in session.scalars(select(AuditEntry).where(AuditEntry.matter_id == matter_id).order_by(AuditEntry.seq)):
        if e.prev_hash != prev or e.hash != _hash(prev, e):
            return False, e.id
        prev = e.hash
    return True, None
