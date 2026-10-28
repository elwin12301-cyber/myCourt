"""Pure search rules over record dictionaries. They mirror the front end's mock adapters so both give the same answers
on the same fictional data. A real integration would replace these with an authorised, server-side source."""
from typing import Any

Record = dict[str, Any]


def has(haystack: str | None, needle: str) -> bool:
    return needle.strip().lower() in (haystack or "").lower()


def status_ok(c: Record, f: str) -> bool:
    return f == "Both" or c["status"] == f


def advocates(c: Record) -> list[Record]:
    return [c["petitionerAdvocate"], c["respondentAdvocate"]]


def in_court(rec_court: Record, sel: Record) -> bool:
    return (
        rec_court["state"] == sel["state"] and rec_court["district"] == sel["district"] and rec_court["complex"] == sel["complex"]
        and (not sel.get("establishment") or rec_court["establishment"] == sel["establishment"])
    )


def run_case_query(q: Record, cases: list[Record]) -> list[Record]:
    mode = q["mode"]
    if mode == "cnr":
        return [c for c in cases if c["cnr"] == q["cnr"]]
    here = [c for c in cases if in_court(c["court"], q["court"])]
    if mode == "party":
        return [c for c in here if status_ok(c, q["status"]) and c["year"] == q["year"] and (has(c["petitioner"], q["name"]) or has(c["respondent"], q["name"]))]
    if mode == "caseNumber":
        return [c for c in here if c["caseType"] == q["caseType"] and c["caseNumber"] == str(int(q["number"])) and c["year"] == q["year"]]
    if mode == "filingNumber":
        return [c for c in here if c["caseType"] == q["caseType"] and c["filingNumber"] == str(int(q["number"])) and c["filingYear"] == q["year"]]
    if mode == "advocate":
        if q["by"] == "barCode":
            return [c for c in here if status_ok(c, q["status"]) and any(a["barCode"] == q["barCode"] for a in advocates(c))]
        if q["by"] == "name":
            return [c for c in here if status_ok(c, q["status"]) and any(has(a["name"], q["name"]) for a in advocates(c))]
        return [c for c in here if c["nextHearing"] == q["date"] and any(has(a["name"], q["name"]) for a in advocates(c))]
    if mode == "fir":
        return [
            c for c in here
            if status_ok(c, q["status"]) and c["policeStation"] == q["policeStation"]
            and (not q["number"] or c["firNumber"] == str(int(q["number"]))) and (not q["year"] or c["firYear"] == q["year"])
        ]
    if mode == "act":
        return [
            c for c in here
            if c["status"] == q["status"] and any(a["act"] == q["actType"] and (not q["section"].strip() or has(a["sections"], q["section"])) for a in c["acts"])
        ]
    if mode == "caseType":
        return [c for c in here if c["status"] == q["status"] and c["caseType"] == q["caseType"] and c["year"] == q["year"]]
    return []


def room_key(r: Record) -> str:
    return f"{r['number']} - {r['judge']}"


def kind_of(case_type: str) -> str:
    return "Criminal" if case_type.startswith("Criminal") else "Civil"


def case_order(c: Record) -> tuple:
    return (c["caseType"], c["year"], int(c["caseNumber"]))


def build_cause_list(room: Record, date: str, kind: str, cases: list[Record]) -> Record:
    rows = sorted(
        (
            c for c in cases
            if in_court(c["court"], room) and c["court"]["establishment"] == room["establishment"]
            and c["courtNumberAndJudge"] == room_key(room) and c["nextHearing"] == date and kind_of(c["caseType"]) == kind
        ),
        key=case_order,
    )
    return {"room": room, "date": date, "kind": kind, "entries": [{"serial": i + 1, "record": r} for i, r in enumerate(rows)]}


def run_order_query(q: Record, cases: list[Record], rooms: list[Record]) -> list[Record]:
    here = [c for c in cases if in_court(c["court"], q["court"])]
    mode = q["mode"]
    if mode == "party":
        picked = [c for c in here if c["year"] == q["year"] and (has(c["petitioner"], q["name"]) or has(c["respondent"], q["name"]))]
    elif mode == "caseNumber":
        picked = [c for c in here if c["caseType"] == q["caseType"] and c["caseNumber"] == str(int(q["number"])) and c["year"] == q["year"]]
    elif mode == "courtNumber":
        room = next((r for r in rooms if room_id(r) == q["roomId"]), None)
        picked = [] if room is None else [c for c in here if c["court"]["establishment"] == room["establishment"] and c["courtNumberAndJudge"] == room_key(room)]
    else:
        picked = here
    out = [
        {"order": o, "record": c}
        for c in picked for o in c["orders"]
        if (q["filter"] == "Both" or o["kind"] == q["filter"]) and (mode != "orderDate" or q["from"] <= o["date"] <= q["to"])
    ]
    # Newest order first; ties by case type, year, numeric case number, then newest order number.
    out.sort(key=lambda r: (r["record"]["caseType"], r["record"]["year"], int(r["record"]["caseNumber"]), -int(r["order"]["number"])))
    out.sort(key=lambda r: r["order"]["date"], reverse=True)
    return out


def room_id(r: Record) -> str:
    return f"{r['state']}|{r['district']}|{r['complex']}|{r['establishment']}|{r['number']}"


def run_caveat_query(q: Record, caveats: list[Record]) -> list[Record]:
    here = [c for c in caveats if c["status"] == "Active" and in_court(c["court"], q["court"])]
    mode = q["mode"]
    if mode == "name":
        needle = q["name"].strip().lower()
        field = "caveator" if q["role"] == "caveator" else "caveatee"
        rows = [c for c in here if (c[field].lower().startswith(needle) if q["match"] == "startingWith" else needle in c[field].lower())]
    elif mode == "caseNumber":
        rows = [
            c for c in here
            if c["caseType"] == q["caseType"] and c["caseNumber"] == str(int(q["number"])) and c["caseYear"] == q["year"]
            and (not q["subordinateCourt"] or c["subordinateCourt"] == q["subordinateCourt"])
            and (not q["decisionDate"] or c["decisionDate"] == q["decisionDate"])
        ]
    elif mode == "filingNumber":
        rows = [
            c for c in here
            if c["caseType"] == q["caseType"] and c["filingNumber"] == str(int(q["number"])) and c["filingYear"] == q["year"]
            and (not q["subordinateCourt"] or c["subordinateCourt"] == q["subordinateCourt"])
        ]
    else:
        rows = [c for c in here if str(int(q["caveatNumber"])) in c["caveatNumber"] and c["year"] == q["year"]]
    rows.sort(key=lambda c: int(c["caveatNumber"]))
    rows.sort(key=lambda c: c["year"], reverse=True)
    return rows
