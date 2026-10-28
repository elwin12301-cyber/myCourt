from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core import clock
from ..core.access import matter_for
from ..core.audit import append_audit
from ..core.deps import current_person
from ..core.errors import NotFound, TooLarge
from ..core.serialize import serialize
from ..db import get_session
from ..models.accounts import Person
from ..models.base import check_version
from ..models.workspace import Assignment, Conversation, DraftItem, Message
from ..schemas import workspace as S
from ..services import drafts as svc
from ..services.provider import provider

router = APIRouter(prefix="/api")
MAX_DRAFT_BODY = 100_000
LABEL = "Draft: advocate verification required"


def draft_out(db: Session, d: DraftItem) -> dict:
    # `status` and `sources` are always present; a generated draft says so and is labelled.
    return serialize(d, label=LABEL if d.status == "draft" else "Approved by an advocate", approvals=svc.approvals(db, d.id))


def _load(db: Session, person: Person, matter_id: str, draft_id: str, need: str) -> DraftItem:
    matter_for(db, person, matter_id, need)
    d = db.scalars(select(DraftItem).where(DraftItem.id == draft_id, DraftItem.matter_id == matter_id)).first()
    if d is None:
        raise NotFound()
    return d


@router.get("/matters/{matter_id}/drafts")
def list_drafts(matter_id: str, status: str | None = Query(default=None, pattern="^(draft|approved)$"),
                limit: int = Query(default=50, ge=1, le=200), cursor: int = Query(default=0, ge=0),
                person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    matter_for(db, person, matter_id, "view")
    q = select(DraftItem).where(DraftItem.matter_id == matter_id)
    if status:
        q = q.where(DraftItem.status == status)
    rows = db.scalars(q.order_by(DraftItem.created_at.desc(), DraftItem.id).offset(cursor).limit(limit + 1)).all()
    return {"items": [draft_out(db, d) for d in rows[:limit]], "nextCursor": str(cursor + limit) if len(rows) > limit else None}


@router.post("/matters/{matter_id}/drafts", status_code=201)
def create_draft(matter_id: str, req: S.DraftIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    matter_for(db, person, matter_id, "edit")
    if len(req.body) > MAX_DRAFT_BODY:
        raise TooLarge()
    d = svc.create_draft(db, matter_id, person, req.kind, req.title, req.body, [s.model_dump() for s in req.sources])
    append_audit(db, person.id, matter_id, "create", "draft", d.id)
    db.commit()
    return draft_out(db, d)


@router.get("/matters/{matter_id}/drafts/{draft_id}")
def get_draft(matter_id: str, draft_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    return draft_out(db, _load(db, person, matter_id, draft_id, "view"))


@router.patch("/matters/{matter_id}/drafts/{draft_id}")
def patch_draft(matter_id: str, draft_id: str, req: S.DraftPatch, person: Person = Depends(current_person),
                db: Session = Depends(get_session)) -> dict:
    d = _load(db, person, matter_id, draft_id, "edit")
    check_version(d, req.version)
    changes = req.model_dump(exclude_unset=True, exclude={"version"})
    if len(changes.get("body") or "") > MAX_DRAFT_BODY:
        raise TooLarge()
    was_approved = d.status == "approved"
    svc.edit_draft(db, d, person, changes)
    append_audit(db, person.id, matter_id, "update", "draft", d.id,
                 "fields: " + ", ".join(sorted(changes)) + ("; approval withdrawn" if was_approved else ""))
    db.commit()
    return draft_out(db, d)


@router.delete("/matters/{matter_id}/drafts/{draft_id}")
def delete_draft(matter_id: str, draft_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    from ..models.workspace import DraftApproval
    from sqlalchemy import delete
    d = _load(db, person, matter_id, draft_id, "edit")
    db.execute(delete(DraftApproval).where(DraftApproval.draft_id == d.id))
    db.delete(d)
    append_audit(db, person.id, matter_id, "delete", "draft", draft_id)
    db.commit()
    return {"status": "deleted"}


@router.post("/matters/{matter_id}/drafts/{draft_id}/approve")
def approve(matter_id: str, draft_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    d = _load(db, person, matter_id, draft_id, "edit")  # view-only people get 403
    svc.approve_draft(db, d, person)
    db.commit()
    return draft_out(db, d)


# ---------- research and mapping (demonstration provider, no network) ----------
def _generated(matter_id: str, kind: str, req: S.QueryIn, person: Person, db: Session, fn) -> dict:
    matter_for(db, person, matter_id, "edit")
    body, sources = fn(req.query)
    d = svc.create_draft(db, matter_id, person, kind, req.query[:200], body, sources, by_provider=True)
    append_audit(db, person.id, matter_id, "create", "draft", d.id, f"{kind} draft (demonstration)")
    db.commit()
    return draft_out(db, d)


@router.post("/matters/{matter_id}/research", status_code=201)
def research(matter_id: str, req: S.QueryIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    return _generated(matter_id, "research", req, person, db, provider.research)


@router.post("/matters/{matter_id}/mappings", status_code=201)
def mapping(matter_id: str, req: S.QueryIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    return _generated(matter_id, "mapping", req, person, db, provider.mapping)


# ---------- conversations ----------
def _conv(db: Session, person: Person, conv_id: str) -> Conversation:
    c = db.get(Conversation, conv_id)
    if c is None or c.person_id != person.id:  # conversations are private to their author
        raise NotFound()
    if c.matter_id:
        matter_for(db, person, c.matter_id, "view")
    return c


def _messages(db: Session, conv_id: str) -> list[dict]:
    rows = db.scalars(select(Message).where(Message.conversation_id == conv_id).order_by(Message.position)).all()
    return [serialize(m) for m in rows]


@router.get("/conversations")
def list_conversations(person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    rows = db.scalars(select(Conversation).where(Conversation.person_id == person.id).order_by(Conversation.created_at.desc())).all()
    return {"items": [serialize(c) for c in rows], "nextCursor": None}


@router.post("/conversations", status_code=201)
def create_conversation(req: S.ConversationIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    if req.matter_id:
        matter_for(db, person, req.matter_id, "edit")
    c = Conversation(matter_id=req.matter_id, person_id=person.id, title=req.title)
    db.add(c)
    db.flush()
    append_audit(db, person.id, req.matter_id, "create", "conversation", c.id)
    db.commit()
    return serialize(c)


@router.get("/conversations/{conv_id}")
def get_conversation(conv_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    c = _conv(db, person, conv_id)
    return serialize(c, messages=_messages(db, c.id))


@router.post("/conversations/{conv_id}/messages", status_code=201)
def add_message(conv_id: str, req: S.MessageIn, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    c = _conv(db, person, conv_id)
    if c.matter_id:
        matter_for(db, person, c.matter_id, "edit")
    pos = (db.scalar(select(func.max(Message.position)).where(Message.conversation_id == c.id)) or 0) + 1
    now = clock.now()
    user_msg = Message(conversation_id=c.id, position=pos, role="user", body=req.body, created_at=now)
    db.add(user_msg)
    history = [m["body"] for m in _messages(db, c.id)] + [req.body]
    text, sources = provider.reply(history)
    reply_draft_id = None
    if c.matter_id:
        d = svc.create_draft(db, c.matter_id, person, "reply", c.title[:200], text, sources, by_provider=True)
        reply_draft_id = d.id
    db.add(Message(conversation_id=c.id, position=pos + 1, role="assistant", body=text, draft_id=reply_draft_id, created_at=now))
    append_audit(db, person.id, c.matter_id, "create", "message", c.id, "assistant reply (demonstration)")
    db.commit()
    return serialize(c, messages=_messages(db, c.id), label=LABEL, isDemoContent=True)


_unused = Assignment  # re-exported for tests that import it from here
