"""Grows the fictional eCourts-style demonstration data to `target` records each for cases, caveats and processes.

Everything is generated deterministically (same data every run) and stays inside the demo court hierarchy, so every record can be
found through the existing screens: the court pickers only offer the demo states, districts and complexes. Values for stages,
purposes, order titles, acts, police stations and subordinate courts are reused from the base demo data, so the translated
screens keep working. Party and advocate names are obviously fictional ("Sample Party 007"). Safe to run again: records that
already exist are skipped and the totals only ever grow up to `target`.
"""
import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models.services import CaseRow, CaveatRow, CourtRoomRow, ProcessRow
from .services_site import court_of

_CRIMINAL = ["Criminal Case (CC)", "Criminal Appeal (CRL.A)"]
_CIVIL = ["Civil Suit (CS)", "Writ Petition (WP)", "Miscellaneous Petition (MP)"]
_CRIMINAL_ACTS = [("Bharatiya Nyaya Sanhita", "303"), ("Bharatiya Nyaya Sanhita", "318"), ("Indian Penal Code", "420, 34"),
                  ("Code of Criminal Procedure", "374"), ("Negotiable Instruments Act", "138")]
_CIVIL_ACTS = [("Code of Civil Procedure", "Order 1"), ("Code of Civil Procedure", "Order 39"), ("Code of Civil Procedure", "Order 7 Rule 1")]
_PENDING_CRIMINAL = ["Bail hearing", "Charge framing", "Complainant evidence", "Evidence"]
_PENDING_CIVIL = ["Written statement", "Issues", "Evidence"]
_PURPOSES = ["First hearing", "Arguments", "Evidence", "Bail hearing", "Charge framing", "Written statement", "Framing of issues"]
_INTERIM_ORDERS = ["Order on first hearing (demo)", "Order granting time (demo)", "Interim order (demo)", "Interim stay order (demo)"]
_HEARING_DATES = ["2026-10-28", "2026-10-30", "2026-11-05", "2026-11-12", "2026-11-19"]
_POLICE = {
    "Chennai": ["Demo Police Station - Chennai Central", "Demo Police Station - Chennai North"],
    "Madurai": ["Demo Police Station - Madurai Town"], "Mumbai": ["Demo Police Station - Mumbai Fort"],
    "Pune": ["Demo Police Station - Pune Camp"], "New Delhi": ["Demo Police Station - New Delhi One"],
}
_CODES = {"Chennai": ("TNCH", "TN"), "Madurai": ("TNMD", "TN"), "Mumbai": ("MHMU", "MH"), "Pune": ("MHPU", "MH"), "New Delhi": ("DLND", "DL")}
_SUBORDINATE = ["Magistrate Court No. 3 (demo)", "Magistrate Court No. 5 (demo)", "City Civil Court (demo)", "Sessions Court (demo)",
                "Magistrate Court No. 21 (demo)"]
_PROCESS_COURTS = ["Sessions Court, Chennai (demo)", "City Civil Court, Chennai (demo)", "Magistrate Courts, New Delhi (demo)"]
_PROCESS_REFS = ["Criminal Case (CC) 412/2025 (demo)", "Civil Suit (CS) 118/2024 (demo)", "Criminal Case (CC) 905/2023 (demo)"]


def _is_criminal(room: dict) -> bool:
    """Courts named Sessions or Magistrate hear criminal matters; the rest hear civil ones."""
    return any(w in room["establishment"] for w in ("Sessions", "Magistrate"))


def _case(n: int, rooms: list[dict], rng: random.Random) -> dict:
    room = rooms[n % len(rooms)]
    criminal = _is_criminal(room)
    year = 2023 + n % 4
    d0 = date(year, 1 + n % 12, 1 + n % 27)
    disposed = n % 10 >= 7  # about 30 percent
    case_type = rng.choice(_CRIMINAL if criminal else _CIVIL)
    district = room["district"]
    cnr_code, state2 = _CODES[district]
    judge = room["judge"]
    next_hearing = None if disposed else _HEARING_DATES[n % len(_HEARING_DATES)]
    last = date.fromisoformat(next_hearing) if next_hearing else date(2026, 10, 1)
    history = [{"date": (last - timedelta(days=30 * (i + 1))).isoformat(), "businessOn": (last - timedelta(days=30 * i)).isoformat(),
                "purpose": _PURPOSES[(n + i) % len(_PURPOSES)], "judge": judge} for i in range(rng.randint(2, 3))]
    orders = []
    for i in range(rng.randint(1, 2)):
        orders.append({"date": (last - timedelta(days=30 * (i + 1))).isoformat(), "title": _INTERIM_ORDERS[(n + i) % len(_INTERIM_ORDERS)],
                       "kind": "Interim", "hasDocument": False})
    if disposed:
        orders.append({"date": date(2026, 10, 1).isoformat(), "title": "Final judgment (demo)" if criminal else "Decree (demo)", "kind": "Final", "hasDocument": False})
    orders.sort(key=lambda o: o["date"])
    for i, o in enumerate(orders, 1):
        o["number"] = str(i)
    acts = [dict(zip(("act", "sections"), rng.choice(_CRIMINAL_ACTS if criminal else _CIVIL_ACTS)))]
    return {
        "cnr": f"{cnr_code}01{990000 + n:06d}{year}", "caseType": case_type, "caseNumber": str(100 + n), "year": str(year),
        "filingNumber": str(2000 + n), "filingYear": str(year), "filingDate": d0.isoformat(),
        "registrationDate": (d0 + timedelta(days=2)).isoformat(),
        "petitioner": f"Sample Party {n:03d} (demo)", "respondent": f"Demo Respondent {n:03d} (demo)",
        "petitionerAdvocate": {"name": f"Demo Advocate P{n:03d}", "barCode": f"{state2}/{n:04d}/{2000 + n % 20}"},
        "respondentAdvocate": {"name": f"Demo Advocate R{n:03d}", "barCode": f"{state2}/{5000 + n:04d}/{2001 + n % 20}"},
        "firNumber": str(100 + n) if criminal else None, "firYear": str(year) if criminal else None,
        "policeStation": _POLICE[district][n % len(_POLICE[district])] if criminal else None,
        "acts": acts, "court": court_of(room), "courtNumberAndJudge": f"{room['number']} - {judge}",
        "status": "Disposed" if disposed else "Pending", "firstHearing": (d0 + timedelta(days=45)).isoformat(),
        "nextHearing": next_hearing, "decisionDate": date(2026, 10, 1).isoformat() if disposed else None,
        "stage": ("Judgment pronounced" if criminal else "Decree passed") if disposed else rng.choice(_PENDING_CRIMINAL if criminal else _PENDING_CIVIL),
        "history": history, "orders": orders,
        "iaBusiness": [{"ia": f"IA {1 + n % 3}/{year}", "party": ("Petitioner", "Respondent")[n % 2], "date": history[-1]["date"], "status": "Pending"}] if n % 3 == 0 else [],
    }


def _caveat(n: int, rooms: list[dict], rng: random.Random) -> dict:
    room = rooms[n % len(rooms)]
    year = 2024 + n % 2
    return {
        "caveatNumber": str(100 + n), "year": str(year), "caveator": f"Sample Caveator {n:03d} (demo)", "caveatee": f"Sample Caveatee {n:03d} (demo)",
        "court": court_of(room), "subordinateCourt": _SUBORDINATE[n % len(_SUBORDINATE)],
        "caseType": rng.choice(_CRIMINAL if _is_criminal(room) else _CIVIL), "caseNumber": str(200 + n), "caseYear": str(year - 1),
        "filingNumber": str(3000 + n), "filingYear": str(year - 1),
        "decisionDate": (date(year, 1 + n % 12, 1 + n % 27)).isoformat() if n % 2 == 0 else None,
        "status": "Expired" if n % 10 == 9 else "Active",
    }


def _process(n: int, rng: random.Random) -> dict:
    return {
        "processId": f"PRC-DEMO-{n:04d}", "email": f"demo.process.{n:04d}@example.invalid", "caseRef": _PROCESS_REFS[n % 3],
        "type": ("Summons", "Notice", "Warrant")[n % 3], "issuedOn": (date(2026, 1, 1) + timedelta(days=n * 2)).isoformat(),
        "status": ("Issued", "Served", "Returned", "Pending")[n % 4], "court": _PROCESS_COURTS[n % 3],
    }


def seed_services_bulk(db: Session, target: int = 100) -> dict[str, int]:
    """Tops each table up to `target` fictional records. Returns how many were added per table."""
    rooms = [r.body for r in db.scalars(select(CourtRoomRow).order_by(CourtRoomRow.id))]
    if not rooms:
        raise RuntimeError("Load the base demo data first (python -m app.cli migrate).")
    rng = random.Random(20261028)
    added = {"cases": 0, "caveats": 0, "processes": 0}

    have = set(db.scalars(select(CaseRow.cnr)))
    for n in range(1, target * 3):
        if len(have) >= target:
            break
        c = _case(n, rooms, rng)
        if c["cnr"] in have:
            continue
        db.add(CaseRow(cnr=c["cnr"], body=c, **court_of(c["court"])))
        have.add(c["cnr"])
        added["cases"] += 1

    seen = {(b["caveatNumber"], b["year"]) for b in db.scalars(select(CaveatRow.body))}
    total = db.scalar(select(func.count()).select_from(CaveatRow)) or 0
    for n in range(1, target * 3):
        if total >= target:
            break
        c = _caveat(n, rooms, rng)
        key = (c["caveatNumber"], c["year"])
        if key in seen:
            continue
        db.add(CaveatRow(status=c["status"], body=c, **court_of(c["court"])))
        seen.add(key)
        total += 1
        added["caveats"] += 1

    ids = set(db.scalars(select(ProcessRow.process_id)))
    for n in range(1, target * 3):
        if len(ids) >= target:
            break
        p = _process(n, rng)
        if p["processId"] in ids:
            continue
        db.add(ProcessRow(process_id=p["processId"], email=p["email"], body={k: v for k, v in p.items() if k != "email"}))
        ids.add(p["processId"])
        added["processes"] += 1

    db.commit()
    return added
