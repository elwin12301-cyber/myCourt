"""Fictional demonstration workspace. Everything created here is flagged `is_demo` and uses reserved example addresses."""
import secrets
from datetime import date, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..core import clock
from ..core.audit import append_audit
from ..core.security import hash_password
from ..models.accounts import Person, SessionRow
from ..models.workspace import (
    Assignment, CalendarEntry, Conversation, Document, DraftItem, IntakeRecord, Matter, Message, Task, TimeEntry,
)

DEMO_DOMAIN = "@example.invalid"
ADVOCATES = [("demo.advocate.one" + DEMO_DOMAIN, "Demo Advocate One"), ("demo.advocate.two" + DEMO_DOMAIN, "Demo Advocate Two")]


def seed_demo(db: Session, password: str | None = None) -> dict:
    """Creates two fictional advocates and three fictional matters. Returns the generated password ONCE."""
    password = password or secrets.token_urlsafe(16)
    people = []
    for email, name in ADVOCATES:
        p = db.scalars(select(Person).where(Person.email == email)).first()
        if p is None:
            p = Person(email=email, display_name=name, password_hash=hash_password(password))
            db.add(p)
            db.flush()
        people.append(p)
    one, two = people
    specs = [
        ("State (demo) v. Sample Party One", one, [(two, "view")]),
        ("Sample Foundation v. Demo Authority", one, [(two, "edit")]),
        ("Demo Estate Matter", two, []),
    ]
    for title, owner, shared in specs:
        if db.scalars(select(Matter).where(Matter.title == title, Matter.is_demo.is_(True))).first():
            continue
        m = Matter(title=title, client_ref="DEMO-" + secrets.token_hex(2).upper(), status="open", is_demo=True, created_by=owner.id)
        db.add(m)
        db.flush()
        db.add(Assignment(matter_id=m.id, person_id=owner.id, level="owner", granted_by=owner.id, granted_at=clock.now()))
        for other, level in shared:
            db.add(Assignment(matter_id=m.id, person_id=other.id, level=level, granted_by=owner.id, granted_at=clock.now()))
        db.add(Task(matter_id=m.id, title="Prepare chronology (demo)", due=date.today() + timedelta(days=7)))
        db.add(CalendarEntry(matter_id=m.id, kind="hearing", title="Hearing (demo)", starts_at=clock.now() + timedelta(days=14)))
        db.add(CalendarEntry(matter_id=m.id, kind="deadline", title="Filing deadline (demo, unapproved)", starts_at=clock.now() + timedelta(days=10)))
        db.add(Document(matter_id=m.id, name="Sample petition (demo).pdf", file_type="pdf", extracted_text="Fictional demonstration text.",
                        extraction_confidence=0.82))
        db.add(DraftItem(matter_id=m.id, kind="summary", title="Matter summary (demo)", body="Demonstration content only.",
                         sources=[], status="draft", generated_by="demo_provider", is_demo_content=True))
        db.add(TimeEntry(matter_id=m.id, person_id=owner.id, worked_on=date.today(), minutes=90, rate_paise=250000, description="Review (demo)"))
        append_audit(db, owner.id, m.id, "create", "matter", m.id, "demonstration matter")
    db.commit()
    return {"password": password, "emails": [e for e, _ in ADVOCATES]}


def remove_demo(db: Session) -> dict:
    """Removes demo matters and their contents, and the seeded demo accounts that no longer have access to anything."""
    from ..routers.matters import remove_matter_data
    ids = list(db.scalars(select(Matter.id).where(Matter.is_demo.is_(True))))
    for mid in ids:
        remove_matter_data(db, mid)
    removed = 0
    for p in list(db.scalars(select(Person).where(Person.email.like("%" + DEMO_DOMAIN)))):
        if db.scalars(select(Assignment).where(Assignment.person_id == p.id)).first():
            continue  # still has access to a non-demo matter: keep the account
        db.execute(delete(SessionRow).where(SessionRow.person_id == p.id))
        db.execute(delete(IntakeRecord).where(IntakeRecord.person_id == p.id))
        for c in list(db.scalars(select(Conversation).where(Conversation.person_id == p.id))):
            db.execute(delete(Message).where(Message.conversation_id == c.id))
            db.delete(c)
        db.delete(p)
        removed += 1
    db.commit()
    return {"matters": len(ids), "people": removed}
