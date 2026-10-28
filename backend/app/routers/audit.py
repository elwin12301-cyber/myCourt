from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.access import matter_for
from ..core.audit import verify_chain
from ..core.deps import current_person
from ..core.serialize import serialize
from ..db import get_session
from ..models.accounts import Person
from ..models.audit import AuditEntry

router = APIRouter(prefix="/api")


@router.get("/matters/{matter_id}/audit")
def trail(matter_id: str, limit: int = Query(default=50, ge=1, le=200), cursor: int = Query(default=0, ge=0),
          person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    matter_for(db, person, matter_id, "owner")
    rows = db.scalars(select(AuditEntry).where(AuditEntry.matter_id == matter_id).order_by(AuditEntry.seq.desc()).offset(cursor).limit(limit + 1)).all()
    items = [serialize(e, exclude=("seq", "prev_hash")) for e in rows[:limit]]
    return {"items": items, "nextCursor": str(cursor + limit) if len(rows) > limit else None}


@router.get("/matters/{matter_id}/audit/verify")
def verify(matter_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    matter_for(db, person, matter_id, "owner")
    ok, first_bad = verify_chain(db, matter_id)
    return {"ok": ok, "firstBadId": first_bad}
