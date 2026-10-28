"""Records that live under a matter: tasks, calendar, documents, voice notes, time entries, invoices.
Every route loads the matter through `matter_for`; reads need `view`, changes need `edit`."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core import clock
from ..core.access import matter_for
from ..core.audit import append_audit
from ..core.deps import current_person
from ..core.errors import Invalid, NotFound, TooLarge
from ..core.serialize import serialize
from ..db import get_session
from ..models.accounts import Person
from ..models.base import bump, check_version
from ..models.workspace import CalendarEntry, Document, Invoice, Task, TimeEntry, VoiceNote
from ..schemas import workspace as S
from ..services.billing import compute_lines

router = APIRouter(prefix="/api")

MAX_DOC_TEXT = 200_000
MAX_VOICE_TEXT = 50_000


def _limit(text: str | None, n: int) -> None:
    if text is not None and len(text) > n:
        raise TooLarge(f"That text is longer than {n:,} characters.")


def crud(name: str, target: str, Model, Create, PatchM, *, prepare=None, serializer=None):
    """Registers list / create / get / patch / delete for `/matters/{id}/<name>`."""
    out = serializer or (lambda o: serialize(o))

    def load(db: Session, person: Person, matter_id: str, item_id: str, need: str):
        matter_for(db, person, matter_id, need)
        item = db.scalars(select(Model).where(Model.id == item_id, Model.matter_id == matter_id)).first()
        if item is None:
            raise NotFound()
        return item

    @router.get(f"/matters/{{matter_id}}/{name}", name=f"{target}_list")
    def list_items(matter_id: str, limit: int = Query(default=50, ge=1, le=200), cursor: int = Query(default=0, ge=0),
                   person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
        matter_for(db, person, matter_id, "view")
        rows = db.scalars(select(Model).where(Model.matter_id == matter_id).order_by(Model.created_at, Model.id).offset(cursor).limit(limit + 1)).all()
        return {"items": [out(r) for r in rows[:limit]], "nextCursor": str(cursor + limit) if len(rows) > limit else None}

    @router.post(f"/matters/{{matter_id}}/{name}", status_code=201, name=f"{target}_create")
    def create_item(matter_id: str, req: Create, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
        matter_for(db, person, matter_id, "edit")
        data = req.model_dump()
        if prepare:
            data = prepare(data, db, matter_id, person, None)
        item = Model(matter_id=matter_id, **data)
        db.add(item)
        db.flush()
        append_audit(db, person.id, matter_id, "create", target, item.id)
        db.commit()
        return out(item)

    @router.get(f"/matters/{{matter_id}}/{name}/{{item_id}}", name=f"{target}_get")
    def get_item(matter_id: str, item_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
        return out(load(db, person, matter_id, item_id, "view"))

    @router.patch(f"/matters/{{matter_id}}/{name}/{{item_id}}", name=f"{target}_patch")
    def patch_item(matter_id: str, item_id: str, req: PatchM, person: Person = Depends(current_person),
                   db: Session = Depends(get_session)) -> dict:
        item = load(db, person, matter_id, item_id, "edit")
        check_version(item, req.version)
        changes = req.model_dump(exclude_unset=True, exclude={"version"})
        if prepare:
            changes = prepare(changes, db, matter_id, person, item)
        for k, v in changes.items():
            setattr(item, k, v)
        bump(item)
        append_audit(db, person.id, matter_id, "update", target, item.id, "fields: " + ", ".join(sorted(changes)))
        db.commit()
        return out(item)

    @router.delete(f"/matters/{{matter_id}}/{name}/{{item_id}}", name=f"{target}_delete")
    def delete_item(matter_id: str, item_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
        item = load(db, person, matter_id, item_id, "edit")
        db.delete(item)
        append_audit(db, person.id, matter_id, "delete", target, item_id)
        db.commit()
        return {"status": "deleted"}

    return load


# ---------- tasks ----------
crud("tasks", "task", Task, S.TaskIn, S.TaskPatch)


# ---------- calendar (a deadline is unapproved until a person with edit access approves it, FR-013) ----------
def _calendar_prepare(data, db, matter_id, person, item):
    # Changing a deadline withdraws any earlier approval.
    if item is not None and item.approved_at is not None and any(k in data for k in ("kind", "title", "starts_at", "ends_at")):
        data = {**data, "approved_by": None, "approved_at": None}
    return data


_load_calendar = crud("calendar", "calendar_entry", CalendarEntry, S.CalendarIn, S.CalendarPatch, prepare=_calendar_prepare)


@router.post("/matters/{matter_id}/calendar/{item_id}/approve")
def approve_calendar(matter_id: str, item_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    item = _load_calendar(db, person, matter_id, item_id, "edit")
    item.approved_by, item.approved_at = person.id, clock.now()
    bump(item)
    append_audit(db, person.id, matter_id, "approve", "calendar_entry", item.id)
    db.commit()
    return serialize(item)


# ---------- documents ----------
def _document_prepare(data, db, matter_id, person, item):
    _limit(data.get("extracted_text"), MAX_DOC_TEXT)
    if item is not None and "extracted_text" in data:
        data = {**data, "review_status": "needs_review", "reviewed_by": None, "reviewed_at": None}
    return data


_load_document = crud("documents", "document", Document, S.DocumentIn, S.DocumentPatch, prepare=_document_prepare)


@router.post("/matters/{matter_id}/documents/{item_id}/review")
def review_document(matter_id: str, item_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    item = _load_document(db, person, matter_id, item_id, "edit")
    item.review_status, item.reviewed_by, item.reviewed_at = "reviewed", person.id, clock.now()
    bump(item)
    append_audit(db, person.id, matter_id, "approve", "document", item.id, "extraction reviewed")
    db.commit()
    return serialize(item)


# ---------- voice notes (the transcript is produced in the browser; nothing is sent to a speech service) ----------
def _voice_prepare(data, db, matter_id, person, item):
    _limit(data.get("transcript"), MAX_VOICE_TEXT)
    return data


_load_voice = crud("voice-notes", "voice_note", VoiceNote, S.VoiceNoteIn, S.VoiceNotePatch, prepare=_voice_prepare)


@router.post("/matters/{matter_id}/voice-notes/{item_id}/review")
def review_voice(matter_id: str, item_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    item = _load_voice(db, person, matter_id, item_id, "edit")
    item.review_status, item.reviewed_by, item.reviewed_at = "reviewed", person.id, clock.now()
    bump(item)
    append_audit(db, person.id, matter_id, "approve", "voice_note", item.id, "transcript reviewed")
    db.commit()
    return serialize(item)


# ---------- time entries ----------
def _time_prepare(data, db, matter_id, person, item):
    return {**data, "person_id": person.id} if item is None else data


crud("time-entries", "time_entry", TimeEntry, S.TimeEntryIn, S.TimeEntryPatch, prepare=_time_prepare)


# ---------- invoices (totals are computed here, never trusted from the client) ----------
def _invoice_prepare(data, db, matter_id, person, item):
    if item is not None and item.status == "approved":
        raise Invalid("An approved invoice cannot be changed.")
    if "time_entry_ids" in data or "lines" in data or item is None:
        entries = data.pop("time_entry_ids", None) or []
        lines = data.pop("lines", None) or []
        built = compute_lines(db, matter_id, entries, lines)
        data["lines"] = built
        data["total_paise"] = sum(line["amountPaise"] for line in built)
    return data


_load_invoice = crud("invoices", "invoice", Invoice, S.InvoiceIn, S.InvoicePatch, prepare=_invoice_prepare)


@router.post("/matters/{matter_id}/invoices/{item_id}/approve")
def approve_invoice(matter_id: str, item_id: str, person: Person = Depends(current_person), db: Session = Depends(get_session)) -> dict:
    item = _load_invoice(db, person, matter_id, item_id, "edit")
    if item.status == "approved":
        raise Invalid("This invoice is already approved.")
    # Recompute from the stored lines so the approved total always matches them.
    item.total_paise = sum(line["amountPaise"] for line in item.lines)
    item.status, item.approved_by, item.approved_at = "approved", person.id, clock.now()
    bump(item)
    append_audit(db, person.id, matter_id, "approve", "invoice", item.id)
    db.commit()
    return serialize(item)
