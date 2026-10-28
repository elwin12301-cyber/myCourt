from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core import clock
from ..core.deps import current_person
from ..core.serialize import serialize
from ..db import get_session
from ..models.accounts import Person
from ..models.workspace import Assignment, CalendarEntry, DraftItem, Matter, Task

router = APIRouter(prefix="/api")


def _mine(person: Person):
    return select(Assignment.matter_id).where(Assignment.person_id == person.id)


@router.get("/dashboard")
def dashboard(person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    ids = _mine(person)
    n = lambda q: db.scalar(q) or 0  # noqa: E731
    upcoming = db.scalars(select(CalendarEntry).where(CalendarEntry.matter_id.in_(ids), CalendarEntry.starts_at >= clock.now())
                          .order_by(CalendarEntry.starts_at).limit(5)).all()
    return {
        "matters": n(select(func.count()).select_from(Matter).where(Matter.id.in_(ids))),
        "openTasks": n(select(func.count()).select_from(Task).where(Task.matter_id.in_(ids), Task.done.is_(False))),
        "draftsAwaitingApproval": n(select(func.count()).select_from(DraftItem).where(DraftItem.matter_id.in_(ids), DraftItem.status == "draft")),
        "unapprovedDeadlines": n(select(func.count()).select_from(CalendarEntry).where(
            CalendarEntry.matter_id.in_(ids), CalendarEntry.kind == "deadline", CalendarEntry.approved_at.is_(None))),
        "nextDates": [serialize(e) for e in upcoming],
    }


def _parse(value: str | None, default: datetime) -> datetime:
    if not value:
        return default
    try:
        d = datetime.fromisoformat(value)
    except ValueError:
        return default
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


@router.get("/calendar")
def calendar(from_: str | None = Query(default=None, alias="from"), to: str | None = None, person: Person = Depends(current_person),
             db: Session = Depends(get_session)) -> dict:
    start = _parse(from_, clock.now() - timedelta(days=1))
    end = _parse(to, start + timedelta(days=62))
    rows = db.scalars(select(CalendarEntry).where(CalendarEntry.matter_id.in_(_mine(person)), CalendarEntry.starts_at >= start,
                                                  CalendarEntry.starts_at < end).order_by(CalendarEntry.starts_at).limit(500)).all()
    return {"items": [serialize(e) for e in rows], "nextCursor": None}
