"""Loads the fictional demonstration data (exported from the front end's mock data) into an empty database."""
import json
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models.services import CaseRow, CaveatRow, CourtRoomRow, LocationRow, ProcessRow

DATA_FILE = Path(__file__).parent / "demo_data.json"


def room_id(r: dict) -> str:
    return f"{r['state']}|{r['district']}|{r['complex']}|{r['establishment']}|{r['number']}"


def court_of(court: dict) -> dict:
    return {k: court.get(k, "") for k in ("state", "district", "complex", "establishment")}


def seed(session: Session, data: dict | None = None) -> bool:
    """Seeds only when there are no cases yet. Returns True if it inserted anything."""
    if session.scalar(select(func.count()).select_from(CaseRow)):
        return False
    data = data or json.loads(DATA_FILE.read_text(encoding="utf-8"))
    session.add_all(CaseRow(cnr=c["cnr"], body=c, **court_of(c["court"])) for c in data["cases"])
    session.add_all(CourtRoomRow(id=room_id(r), body=r, **court_of(r)) for r in data["courtRooms"])
    session.add_all(CaveatRow(status=c["status"], body=c, **court_of(c["court"])) for c in data["caveats"])
    session.add_all(ProcessRow(process_id=p["processId"], email=p["email"].lower(), body={k: v for k, v in p.items() if k != "email"}) for p in data["processes"])
    session.add_all(LocationRow(body=loc, **court_of(loc["court"])) for loc in data["locations"])
    session.commit()
    return True
