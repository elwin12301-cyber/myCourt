from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import clock
from ..core.audit import append_audit
from ..core.deps import current_person
from ..core.errors import Conflict, Invalid, NotFound
from ..core.serialize import serialize
from ..db import get_session
from ..models.accounts import Person
from ..models.base import bump, check_version
from ..models.workspace import Assignment, IntakeRecord, Matter
from ..schemas import workspace as S

router = APIRouter(prefix="/api")


def _load(db: Session, person: Person, intake_id: str) -> IntakeRecord:
    r = db.get(IntakeRecord, intake_id)
    if r is None or r.person_id != person.id:  # intake records belong to the advocate who made them
        raise NotFound()
    return r


@router.get("/intake")
def list_intake(person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    rows = db.scalars(select(IntakeRecord).where(IntakeRecord.person_id == person.id).order_by(IntakeRecord.created_at.desc())).all()
    return {"items": [serialize(r) for r in rows], "nextCursor": None}


@router.post("/intake", status_code=201)
def create_intake(req: S.IntakeIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    r = IntakeRecord(person_id=person.id, **req.model_dump())
    db.add(r)
    db.flush()
    append_audit(db, person.id, None, "create", "intake", r.id)
    db.commit()
    return serialize(r)


@router.get("/intake/{intake_id}")
def get_intake(intake_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    return serialize(_load(db, person, intake_id))


@router.patch("/intake/{intake_id}")
def patch_intake(intake_id: str, req: S.IntakePatch, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    r = _load(db, person, intake_id)
    check_version(r, req.version)
    changes = req.model_dump(exclude_unset=True, exclude={"version"})
    for k, v in changes.items():
        setattr(r, k, v)
    # Editing the details withdraws an earlier "clear": the advocate must confirm again (FR-015).
    if r.conflict_check == "clear" and changes:
        r.conflict_check, r.confirmed_by, r.confirmed_at = "needs_review", None, None
    bump(r)
    append_audit(db, person.id, None, "update", "intake", r.id, "fields: " + ", ".join(sorted(changes)))
    db.commit()
    return serialize(r)


@router.post("/intake/{intake_id}/conflict-check/confirm")
def confirm_conflict(intake_id: str, req: S.ConflictConfirmIn, person: Person = Depends(current_person),
                     db: Session = Depends(get_session)) -> dict:
    """The only way to set the conflict check. `clear` records WHO confirmed it and when."""
    r = _load(db, person, intake_id)
    r.conflict_check, r.conflict_note = req.result, req.note
    r.confirmed_by, r.confirmed_at = person.id, clock.now()
    bump(r)
    append_audit(db, person.id, None, "approve", "intake", r.id, f"conflict check {req.result}")
    db.commit()
    return serialize(r)


@router.post("/intake/{intake_id}/convert", status_code=201)
def convert(intake_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    r = _load(db, person, intake_id)
    if r.matter_id:
        raise Conflict("This intake has already been converted.")
    if r.conflict_check != "clear":
        raise Invalid("Confirm the conflict check as clear before creating a matter.", fields={"conflictCheck": "Not cleared."})
    m = Matter(title=r.prospect_name[:200], client_ref="", status="open", is_demo=True,
               created_by=person.id)
    db.add(m)
    db.flush()
    db.add(Assignment(matter_id=m.id, person_id=person.id, level="owner", granted_by=person.id, granted_at=clock.now()))
    r.matter_id = m.id
    bump(r)
    append_audit(db, person.id, m.id, "create", "matter", m.id, "created from intake")
    db.commit()
    return serialize(m)
