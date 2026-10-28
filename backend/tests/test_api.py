import json
from datetime import date

from app.seed import DATA_FILE

DATA = json.loads(DATA_FILE.read_text(encoding="utf-8"))
CASE = next(c for c in DATA["cases"] if c["orders"])
COURT = {k: CASE["court"][k] for k in ("state", "district", "complex", "establishment")}
THIS_YEAR = date.today().year


def post(client, path, body):
    return client.post(f"/api{path}", json=body)


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["demo"] is True


def test_seed_is_idempotent(client):
    from app.seed import seed
    from app.main import app
    from app.db import get_session

    session = next(app.dependency_overrides[get_session]())
    assert seed(session) is False


# ---- Case Status ----
def test_cnr_found(client):
    r = post(client, "/cases/search", {"query": {"mode": "cnr", "cnr": CASE["cnr"].lower()}})
    assert r.status_code == 200
    assert [c["cnr"] for c in r.json()] == [CASE["cnr"]]


def test_cnr_not_found_is_empty_list(client):
    assert post(client, "/cases/search", {"query": {"mode": "cnr", "cnr": "TNCH019999990000"}}).json() == []


def test_cnr_simulated_outage(client):
    assert post(client, "/cases/search", {"query": {"mode": "cnr", "cnr": "ERROR00000000000"}}).status_code == 503


def test_bad_cnr_is_rejected(client):
    r = post(client, "/cases/search", {"query": {"mode": "cnr", "cnr": "short"}})
    assert r.status_code == 422


def test_party_search_needs_three_characters(client):
    q = {"mode": "party", "court": COURT, "name": "ab", "year": CASE["year"], "status": "Both"}
    assert post(client, "/cases/search", {"query": q}).status_code == 422
    q["name"] = CASE["petitioner"][:4]
    assert CASE["cnr"] in [c["cnr"] for c in post(client, "/cases/search", {"query": q}).json()]


def test_year_out_of_range_is_rejected(client):
    q = {"mode": "caseType", "court": COURT, "caseType": CASE["caseType"], "year": str(THIS_YEAR + 1), "status": "Pending"}
    assert post(client, "/cases/search", {"query": q}).status_code == 422


def test_case_number_search(client):
    q = {"mode": "caseNumber", "court": COURT, "caseType": CASE["caseType"], "number": CASE["caseNumber"], "year": CASE["year"]}
    assert CASE["cnr"] in [c["cnr"] for c in post(client, "/cases/search", {"query": q}).json()]


def test_advocate_bar_code(client):
    q = {"mode": "advocate", "court": COURT, "by": "barCode", "barCode": CASE["petitionerAdvocate"]["barCode"].lower(), "status": "Both"}
    r = post(client, "/cases/search", {"query": q})
    assert r.status_code == 200 and CASE["cnr"] in [c["cnr"] for c in r.json()]


def test_unknown_fields_are_rejected(client):
    r = post(client, "/cases/search", {"query": {"mode": "cnr", "cnr": CASE["cnr"], "admin": True}})
    assert r.status_code == 422


def test_court_is_required(client):
    q = {"mode": "caseType", "court": {**COURT, "state": ""}, "caseType": CASE["caseType"], "year": CASE["year"], "status": "Pending"}
    assert post(client, "/cases/search", {"query": q}).status_code == 422


# ---- Court Orders ----
def test_orders_newest_first(client):
    q = {"mode": "orderDate", "court": COURT, "from": "2000-01-01", "to": "2100-01-01", "filter": "Both"}
    rows = post(client, "/orders/search", {"query": q}).json()
    dates = [r["order"]["date"] for r in rows]
    assert rows and dates == sorted(dates, reverse=True)


def test_order_date_range_must_be_ordered(client):
    q = {"mode": "orderDate", "court": COURT, "from": "2026-02-01", "to": "2026-01-01", "filter": "Both"}
    assert post(client, "/orders/search", {"query": q}).status_code == 422


def test_order_filter_interim_only(client):
    q = {"mode": "orderDate", "court": COURT, "from": "2000-01-01", "to": "2100-01-01", "filter": "Interim"}
    assert {r["order"]["kind"] for r in post(client, "/orders/search", {"query": q}).json()} <= {"Interim"}


# ---- Cause list ----
def test_cause_list(client):
    room = next(r for r in DATA["courtRooms"] if f"{r['number']} - {r['judge']}" == CASE["courtNumberAndJudge"] and r["establishment"] == CASE["court"]["establishment"])
    rid = "|".join([room["state"], room["district"], room["complex"], room["establishment"], room["number"]])
    kind = "Criminal" if CASE["caseType"].startswith("Criminal") else "Civil"
    r = post(client, "/cause-lists", {"roomId": rid, "date": CASE["nextHearing"], "kind": kind})
    assert r.status_code == 200
    body = r.json()
    assert CASE["cnr"] in [e["record"]["cnr"] for e in body["entries"]]
    assert [e["serial"] for e in body["entries"]] == list(range(1, len(body["entries"]) + 1))


def test_cause_list_unknown_court(client):
    assert post(client, "/cause-lists", {"roomId": "nope", "date": "2026-10-28", "kind": "Civil"}).status_code == 404


# ---- Caveat ----
def test_caveats_only_active(client):
    court = next(c for c in DATA["caveats"] if c["status"] == "Expired")["court"]
    q = {"mode": "name", "court": court, "role": "caveator", "match": "anywhere", "name": "a" * 3}
    rows = post(client, "/caveats/search", {"query": q}).json()
    assert all(r["status"] == "Active" for r in rows)


def test_caveat_name_search_finds_demo_caveat(client):
    cav = next(c for c in DATA["caveats"] if c["status"] == "Active")
    q = {"mode": "name", "court": cav["court"], "role": "caveator", "match": "startingWith", "name": cav["caveator"][:4]}
    assert cav["caveatNumber"] in [r["caveatNumber"] for r in post(client, "/caveats/search", {"query": q}).json()]


# ---- Process Details: privacy ----
def test_process_found_and_email_never_returned(client):
    p = DATA["processes"][0]
    r = post(client, "/processes/lookup", {"processId": p["processId"], "email": p["email"].upper()})
    assert r.status_code == 200 and r.json()["process"]["processId"] == p["processId"]
    assert p["email"] not in r.text and "email" not in r.json()["process"]


def test_wrong_email_and_unknown_id_look_the_same(client):
    p = DATA["processes"][0]
    wrong_email = post(client, "/processes/lookup", {"processId": p["processId"], "email": "someone.else@example.invalid"})
    unknown_id = post(client, "/processes/lookup", {"processId": "PRC-NOPE-9999", "email": p["email"]})
    assert wrong_email.status_code == unknown_id.status_code == 200
    assert wrong_email.json() == unknown_id.json() == {"process": None}


def test_process_lookup_is_post_only(client):
    assert client.get("/api/processes/lookup?processId=x&email=y").status_code == 405


# ---- Location ----
def test_location_found_and_missing(client):
    loc = DATA["locations"][0]
    court = {k: loc["court"][k] for k in ("state", "district", "complex", "establishment")}
    assert post(client, "/locations/find", {"court": court}).json()["location"]["address"] == loc["address"]
    assert post(client, "/locations/find", {"court": {**court, "complex": "Nowhere"}}).json() == {"location": None}


def test_court_rooms_listed(client):
    assert len(client.get("/api/court-rooms").json()) == len(DATA["courtRooms"])
