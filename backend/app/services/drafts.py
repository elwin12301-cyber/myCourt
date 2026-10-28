"""Draft state machine (research D9): draft -> approved only by an explicit approval; any edit returns it to draft."""
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..core import clock
from ..core.audit import append_audit
from ..models.accounts import Person
from ..models.base import bump
from ..models.workspace import DraftApproval, DraftItem


def create_draft(db: Session, matter_id: str, person: Person | None, kind: str, title: str, body: str, sources: list[dict],
                 *, by_provider: bool = False) -> DraftItem:
    d = DraftItem(matter_id=matter_id, kind=kind, title=title, body=body, sources=sources, status="draft",
                  generated_by="demo_provider" if by_provider else "person", is_demo_content=by_provider)
    db.add(d)
    db.flush()
    return d


def edit_draft(db: Session, d: DraftItem, person: Person, changes: dict) -> None:
    for k, v in changes.items():
        setattr(d, k, v)
    if d.status == "approved":
        d.status = "draft"
        db.execute(update(DraftApproval).where(DraftApproval.draft_id == d.id, DraftApproval.revoked_at.is_(None))
                   .values(revoked_at=clock.now()))
    bump(d)


def approve_draft(db: Session, d: DraftItem, person: Person) -> None:
    d.status = "approved"
    db.add(DraftApproval(draft_id=d.id, approved_by=person.id, approved_at=clock.now()))
    bump(d)
    append_audit(db, person.id, d.matter_id, "approve", "draft", d.id)


def approvals(db: Session, draft_id: str) -> list[dict]:
    rows = db.scalars(select(DraftApproval).where(DraftApproval.draft_id == draft_id).order_by(DraftApproval.approved_at)).all()
    return [{"approvedBy": r.approved_by, "approvedAt": r.approved_at.isoformat(),
             "revokedAt": r.revoked_at.isoformat() if r.revoked_at else None} for r in rows]
