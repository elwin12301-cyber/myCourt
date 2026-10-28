from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..services import search
from ..config import settings
from ..core.errors import Unavailable
from ..db import get_session
from ..models.services import CaseRow, CaveatRow, CourtRoomRow, LocationRow, ProcessRow
from ..schemas.services_site import CaseSearch, CaveatSearch, CauseListQuery, LocationLookup, OrderSearch, ProcessLookup

router = APIRouter(prefix="/api")

Body = dict[str, Any]


def _bodies(session: Session, model) -> list[Body]:
    return [row.body for row in session.scalars(select(model))]


@router.get("/health")
def health(session: Session = Depends(get_session)) -> Body:
    try:
        session.execute(select(1))
    except Exception as e:  # the database is not reachable
        raise Unavailable() from e
    return {"status": "ok", "demo": True, "mode": settings.mode, "note": "Fictional demonstration data only."}


@router.post("/cases/search")
def search_cases(req: CaseSearch, session: Session = Depends(get_session)) -> list[Body]:
    q = req.query.model_dump(by_alias=True)
    if q["mode"] == "cnr" and q["cnr"] == settings.demo_error_cnr:
        raise HTTPException(503, "Demo service unavailable")
    return search.run_case_query(q, _bodies(session, CaseRow))


@router.post("/orders/search")
def search_orders(req: OrderSearch, session: Session = Depends(get_session)) -> list[Body]:
    q = req.query.model_dump(by_alias=True)
    return search.run_order_query(q, _bodies(session, CaseRow), _bodies(session, CourtRoomRow))


@router.get("/court-rooms")
def court_rooms(session: Session = Depends(get_session)) -> list[Body]:
    return _bodies(session, CourtRoomRow)


@router.post("/cause-lists")
def cause_list(req: CauseListQuery, session: Session = Depends(get_session)) -> Body:
    room = session.get(CourtRoomRow, req.room_id)
    if room is None:
        raise HTTPException(404, "Unknown court")
    return search.build_cause_list(room.body, req.date, req.kind, _bodies(session, CaseRow))


@router.post("/caveats/search")
def search_caveats(req: CaveatSearch, session: Session = Depends(get_session)) -> list[Body]:
    return search.run_caveat_query(req.query.model_dump(by_alias=True), _bodies(session, CaveatRow))


@router.post("/processes/lookup")
def lookup_process(req: ProcessLookup, session: Session = Depends(get_session)) -> Body:
    """POST, so the process ID and e-mail never appear in a URL or access log. A wrong e-mail and an unknown ID give
    the same answer, so the endpoint cannot be used to find out which process IDs exist. The e-mail is never returned."""
    row = session.get(ProcessRow, req.process_id.upper()) or session.get(ProcessRow, req.process_id)
    if row is None or row.email != req.email.strip().lower():
        return {"process": None}
    return {"process": row.body}


@router.post("/locations/find")
def find_location(req: LocationLookup, session: Session = Depends(get_session)) -> Body:
    sel = req.court.model_dump()
    for row in session.scalars(select(LocationRow)):
        c = row.body["court"]
        if c["state"] == sel["state"] and c["district"] == sel["district"] and c["complex"] == sel["complex"] and c["establishment"] == (sel["establishment"] or ""):
            return {"location": row.body}
    return {"location": None}
