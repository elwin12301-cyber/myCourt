"""The single authorisation choke point (research D6). Every route that touches a matter or anything under it loads it
through `matter_for`; every list is built from `visible_matters`. Someone without access gets exactly the answer they
would get for a matter that does not exist."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from .audit import append_audit
from .errors import Forbidden, NotFound
from ..models.accounts import Person
from ..models.workspace import LEVELS, Assignment, Matter


def matter_for(db: Session, person: Person, matter_id: str, need: str = "view", *, audit_view: bool = False) -> tuple[Matter, str]:
    row = db.execute(
        select(Matter, Assignment.level).join(Assignment, Assignment.matter_id == Matter.id)
        .where(Matter.id == matter_id, Assignment.person_id == person.id)
    ).first()
    if row is None:
        if db.get(Matter, matter_id) is not None:
            # Record the attempt for the matter's owners, then answer exactly as for an unknown id.
            append_audit(db, person.id, matter_id, "denied", "matter", matter_id, "no access")
            db.commit()
        raise NotFound()
    matter, level = row
    if LEVELS[level] < LEVELS[need]:
        append_audit(db, person.id, matter.id, "denied", "matter", matter.id, f"needs {need}")
        db.commit()
        raise Forbidden()
    if audit_view:
        append_audit(db, person.id, matter.id, "view", "matter", matter.id)
    return matter, level


def visible_matters(person: Person, is_demo: bool | None = None):
    q = select(Matter, Assignment.level).join(Assignment, Assignment.matter_id == Matter.id).where(Assignment.person_id == person.id)
    if is_demo is not None:
        q = q.where(Matter.is_demo.is_(is_demo))
    return q.order_by(Matter.updated_at.desc(), Matter.id)
