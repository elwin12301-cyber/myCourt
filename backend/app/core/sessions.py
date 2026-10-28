"""Server-side sessions (research D3). The cookie holds a random token; the database holds only its hash."""
from datetime import timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from . import clock
from ..config import settings
from ..models.accounts import Person, SessionRow
from ..models.base import new_id
from .security import new_token, token_hash

COOKIE = "mycourt_session"


def create_session(db: Session, person: Person) -> tuple[str, SessionRow]:
    token = new_token()
    now = clock.now()
    row = SessionRow(id=new_id(), person_id=person.id, token_hash=token_hash(token), csrf_token=new_token(),
                     created_at=now, last_seen_at=now, expires_at=now + timedelta(hours=settings.session_max_hours))
    db.add(row)
    db.flush()
    return token, row


def load_session(db: Session, token: str | None) -> tuple[SessionRow, Person] | None:
    """Returns the live session and its person, sliding the idle timer, or None. Expired rows are removed."""
    if not token:
        return None
    row = db.scalars(select(SessionRow).where(SessionRow.token_hash == token_hash(token))).first()
    if row is None:
        return None
    now = clock.now()
    if row.expires_at <= now or row.last_seen_at + timedelta(minutes=settings.session_idle_minutes) <= now:
        db.delete(row)
        db.commit()
        return None
    person = db.get(Person, row.person_id)
    if person is None or not person.active:
        db.delete(row)
        db.commit()
        return None
    row.last_seen_at = now
    return row, person


def revoke_all(db: Session, person_id: str, except_id: str | None = None) -> None:
    q = delete(SessionRow).where(SessionRow.person_id == person_id)
    if except_id:
        q = q.where(SessionRow.id != except_id)
    db.execute(q)
