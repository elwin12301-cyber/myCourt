from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..core import clock
from ..core.access import matter_for, visible_matters
from ..core.audit import append_audit
from ..core.deps import current_person
from ..core.errors import Conflict, Forbidden, Invalid, NotFound
from ..core.serialize import serialize
from ..db import get_session
from ..models.accounts import Person
from ..models.base import bump, check_version
from ..models.workspace import MATTER_CHILD_TABLES, Assignment, Conversation, Matter
from ..schemas.workspace import MatterIn, MatterPatch, PersonLookupIn, ShareIn

router = APIRouter(prefix="/api")


def matter_out(m: Matter, level: str) -> dict:
    return serialize(m, myLevel=level)


@router.get("/matters")
def list_matters(is_demo: bool | None = Query(default=None, alias="isDemo"), limit: int = Query(default=50, ge=1, le=200),
                 cursor: int = Query(default=0, ge=0), person: Person = Depends(current_person),
                 db: Session = Depends(get_session)) -> dict:
    rows = db.execute(visible_matters(person, is_demo).offset(cursor).limit(limit + 1)).all()
    more = len(rows) > limit
    return {"items": [matter_out(m, lvl) for m, lvl in rows[:limit]], "nextCursor": str(cursor + limit) if more else None}


@router.post("/matters", status_code=201)
def create_matter(req: MatterIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    if not req.is_demo and not settings.allow_real_data:
        raise Forbidden("Real client data is not accepted: this system is in demonstration-only mode.")
    m = Matter(title=req.title.strip(), client_ref=req.client_ref, status=req.status, court_case_ref=req.court_case_ref,
               is_demo=req.is_demo, created_by=person.id)
    db.add(m)
    db.flush()
    db.add(Assignment(matter_id=m.id, person_id=person.id, level="owner", granted_by=person.id, granted_at=clock.now()))
    append_audit(db, person.id, m.id, "create", "matter", m.id, "matter created")
    db.commit()
    return matter_out(m, "owner")


@router.get("/matters/{matter_id}")
def get_matter(matter_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    m, level = matter_for(db, person, matter_id, "view", audit_view=True)
    db.commit()
    return matter_out(m, level)


@router.patch("/matters/{matter_id}")
def patch_matter(matter_id: str, req: MatterPatch, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    m, level = matter_for(db, person, matter_id, "edit")
    check_version(m, req.version)
    changes = req.model_dump(exclude_unset=True, exclude={"version"})
    for k, v in changes.items():
        if v is not None:
            setattr(m, k, v)
    bump(m)
    append_audit(db, person.id, m.id, "update", "matter", m.id, "fields: " + ", ".join(sorted(changes)))
    db.commit()
    return matter_out(m, level)


@router.delete("/matters/{matter_id}")
def delete_matter(matter_id: str, confirm: str = Query(default=""), person: Person = Depends(current_person),
                  db: Session = Depends(get_session)) -> dict:
    m, _ = matter_for(db, person, matter_id, "owner")
    if confirm != m.title:
        raise Invalid("Repeat the matter title to confirm the deletion.", fields={"confirm": "Type the matter title exactly."})
    remove_matter_data(db, m.id)
    append_audit(db, person.id, m.id, "delete", "matter", m.id, "matter and its contents deleted")
    db.commit()
    return {"status": "deleted"}


def remove_matter_data(db: Session, matter_id: str) -> None:
    """Deletes a matter and everything under it. Audit entries are deliberately kept."""
    from ..models.workspace import DraftApproval, DraftItem, Message
    draft_ids = select(DraftItem.id).where(DraftItem.matter_id == matter_id)
    db.execute(delete(DraftApproval).where(DraftApproval.draft_id.in_(draft_ids)))
    conv_ids = select(Conversation.id).where(Conversation.matter_id == matter_id)
    db.execute(delete(Message).where(Message.conversation_id.in_(conv_ids)))
    db.execute(delete(Conversation).where(Conversation.matter_id == matter_id))
    for model in MATTER_CHILD_TABLES:
        db.execute(delete(model).where(model.matter_id == matter_id))
    db.execute(delete(Assignment).where(Assignment.matter_id == matter_id))
    db.execute(delete(Matter).where(Matter.id == matter_id))


# ---------- assignments ----------
def _assignment_out(a: Assignment, p: Person | None) -> dict:
    return {"personId": a.person_id, "displayName": p.display_name if p else "", "level": a.level, "grantedAt": a.granted_at.isoformat()}


@router.get("/matters/{matter_id}/assignments")
def list_assignments(matter_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> list[dict]:
    matter_for(db, person, matter_id, "view")
    rows = db.execute(select(Assignment, Person).join(Person, Person.id == Assignment.person_id).where(Assignment.matter_id == matter_id)).all()
    return [_assignment_out(a, p) for a, p in rows]


def _owner_count(db: Session, matter_id: str) -> int:
    return db.scalar(select(func.count()).select_from(Assignment).where(Assignment.matter_id == matter_id, Assignment.level == "owner")) or 0


@router.put("/matters/{matter_id}/assignments/{person_id}")
def share(matter_id: str, person_id: str, req: ShareIn, person: Person = Depends(current_person),
          db: Session = Depends(get_session)) -> dict:
    matter_for(db, person, matter_id, "owner")
    target = db.get(Person, person_id)
    if target is None or not target.active:
        raise NotFound()
    existing = db.get(Assignment, (matter_id, person_id))
    if existing is not None and existing.level == "owner" and req.level != "owner" and _owner_count(db, matter_id) <= 1:
        raise Conflict("A matter must always keep at least one owner.")
    if existing is None:
        existing = Assignment(matter_id=matter_id, person_id=person_id, level=req.level, granted_by=person.id, granted_at=clock.now())
        db.add(existing)
    else:
        existing.level = req.level
        existing.granted_by = person.id
        existing.granted_at = clock.now()
    append_audit(db, person.id, matter_id, "share", "assignment", person_id, f"level {req.level}")
    db.commit()
    return _assignment_out(existing, target)


@router.delete("/matters/{matter_id}/assignments/{person_id}")
def unshare(matter_id: str, person_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    matter_for(db, person, matter_id, "owner")
    existing = db.get(Assignment, (matter_id, person_id))
    if existing is None:
        raise NotFound()
    if existing.level == "owner" and _owner_count(db, matter_id) <= 1:
        raise Conflict("A matter must always keep at least one owner.")
    db.delete(existing)
    append_audit(db, person.id, matter_id, "unshare", "assignment", person_id)
    db.commit()
    return {"status": "removed"}


@router.post("/people/lookup")
def lookup_person(req: PersonLookupIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    """Finds an existing account by exact e-mail so a matter can be shared with it. POST, so the address is never in a URL.
    Needs sign-in; returns only an id and display name."""
    found = db.scalars(select(Person).where(Person.email == req.email.strip().lower(), Person.active.is_(True))).first()
    if found is None:
        raise NotFound()
    return {"id": found.id, "displayName": found.display_name}
