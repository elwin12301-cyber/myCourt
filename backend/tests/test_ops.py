import json
import logging
import re
from pathlib import Path

import pytest
from sqlalchemy import create_engine, func, inspect, select, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.core import logging as safe_logging
from app.core import real_data
from app.core.audit import verify_chain
from app.db import Base
from app.migrate import upgrade
from app.models.accounts import Person
from app.models.audit import AuditEntry, triggers_present
from app.models.services import CaseRow
from app.models.workspace import Matter
from app.seed import seed
from app.seed.workspace_demo import remove_demo, seed_demo
from app.services.backup import MODELS, export_archive, import_archive

from .helpers import PASSWORD


def sqlite_url(tmp_path: Path, name="t.db") -> str:
    return "sqlite:///" + (tmp_path / name).as_posix()


# ---------- migrations (FR-021, SC-007) ----------
def test_upgrade_from_empty_creates_every_table_and_the_audit_triggers(tmp_path):
    url = sqlite_url(tmp_path)
    upgrade(url)
    engine = create_engine(url)
    names = set(inspect(engine).get_table_names())
    assert {t.name for t in Base.metadata.sorted_tables} <= names and "alembic_version" in names
    with engine.connect() as conn:
        assert triggers_present(conn)


def test_a_second_upgrade_changes_nothing(tmp_path):
    url = sqlite_url(tmp_path)
    upgrade(url)
    engine = create_engine(url)
    with engine.connect() as c:
        before = c.execute(text("SELECT version_num FROM alembic_version")).scalar()
        tables = sorted(inspect(engine).get_table_names())
    upgrade(url)
    with engine.connect() as c:
        assert c.execute(text("SELECT version_num FROM alembic_version")).scalar() == before
    assert sorted(inspect(create_engine(url)).get_table_names()) == tables


def test_upgrading_the_previous_release_keeps_every_row(tmp_path):
    url = sqlite_url(tmp_path)
    upgrade(url, "0001")  # the services-site schema from the previous release
    engine = create_engine(url)
    maker = sessionmaker(bind=engine, expire_on_commit=False)
    with maker() as db:
        seed(db)
        before = db.scalar(select(func.count()).select_from(CaseRow))
    assert before > 0
    upgrade(url)
    with maker() as db:
        assert db.scalar(select(func.count()).select_from(CaseRow)) == before
    assert "persons" in inspect(engine).get_table_names()


def test_upgrade_works_on_a_database_created_before_alembic(tmp_path):
    url = sqlite_url(tmp_path)
    engine = create_engine(url)
    Base.metadata.create_all(engine)  # how the previous release made its tables
    upgrade(url)
    with engine.connect() as c:
        assert c.execute(text("SELECT version_num FROM alembic_version")).scalar() == "0006"


# ---------- demonstration set (FR-018) ----------
def test_demo_set_is_labelled_and_removable(sm):
    with sm() as db:
        out = seed_demo(db, PASSWORD)
        assert out["password"] == PASSWORD
        matters = db.scalars(select(Matter)).all()
        assert len(matters) == 3 and all(m.is_demo for m in matters)
        assert db.scalar(select(func.count()).select_from(Person)) == 2
        seed_demo(db)  # idempotent
        assert db.scalar(select(func.count()).select_from(Matter)) == 3


def test_remove_demo_deletes_only_demo_data(sm, client, alice, monkeypatch):
    monkeypatch.setattr(settings, "allow_real_data", True)
    real = alice.post("/matters", {"title": "Real one", "isDemo": False}).json()
    with sm() as db:
        seed_demo(db)
        removed = remove_demo(db)
        assert removed == {"matters": 3, "people": 2}
        assert [m.title for m in db.scalars(select(Matter))] == ["Real one"]
        assert db.get(Person, alice.person_id) is not None
    assert alice.get(f"/matters/{real['id']}").status_code == 200


def test_a_demo_login_works_and_sees_only_its_own_matters(sm, client):
    with sm() as db:
        seed_demo(db, PASSWORD)
    r = client.post("/api/auth/login", json={"email": "demo.advocate.one@example.invalid", "password": PASSWORD}, headers={"Origin": "http://localhost:5173"})
    assert r.status_code == 200
    titles = [m["title"] for m in client.get("/api/matters").json()["items"]]
    assert "Demo Estate Matter" not in titles and len(titles) == 2


# ---------- backup and restore (FR-022, SC-008) ----------
def fresh_engine():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)


def test_export_then_import_reproduces_everything_including_a_valid_chain(sm, alice, bob):
    m = alice.matter("Backed up")
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "edit"})
    alice.post(f"/matters/{m['id']}/tasks", {"title": "t"})
    alice.post(f"/matters/{m['id']}/research", {"query": "bail"})
    alice.post(f"/matters/{m['id']}/calendar", {"kind": "hearing", "title": "h", "startsAt": "2031-01-01T10:00:00Z"})
    with sm() as db:
        seed_demo(db)
        archive = json.loads(json.dumps(export_archive(db)))  # through JSON, as the CLI does
        counts = {mod.__tablename__: db.scalar(select(func.count()).select_from(mod)) for mod in MODELS}
        matter_ids = list(db.scalars(select(Matter.id)))
    target = fresh_engine()
    with target() as db:
        restored = import_archive(db, archive)
        assert restored == counts and sum(counts.values()) > 20
        assert all(verify_chain(db, mid) == (True, None) for mid in matter_ids)
        # appends after a restore continue the chain
        assert db.scalar(select(func.count()).select_from(AuditEntry)) == counts["audit_entry"]


def test_import_into_a_non_empty_database_is_refused(sm, alice):
    alice.matter()
    with sm() as db:
        archive = export_archive(db)
        with pytest.raises(ValueError):
            import_archive(db, archive)


def test_an_unknown_archive_format_is_refused():
    with fresh_engine()() as db:
        with pytest.raises(ValueError):
            import_archive(db, {"format": 99, "tables": {}})


# ---------- real-data gate (FR-019) ----------
@pytest.fixture()
def gate(sm, monkeypatch):
    monkeypatch.setattr(real_data, "engine", sm.engine)
    return real_data


def test_gate_lists_every_missing_safeguard(gate):
    found = " ".join(gate.problems())
    assert "SECRET_KEY" in found and "COOKIE_SECURE" in found


def test_gate_passes_when_everything_is_in_place(gate, monkeypatch):
    monkeypatch.setattr(settings, "secret_key", "x" * 40)
    monkeypatch.setattr(settings, "cookie_secure", True)
    assert gate.problems() == []


def test_gate_notices_missing_audit_triggers(gate, sm, monkeypatch):
    monkeypatch.setattr(settings, "secret_key", "x" * 40)
    monkeypatch.setattr(settings, "cookie_secure", True)
    with sm.engine.begin() as c:
        c.execute(text("DROP TRIGGER audit_entry_no_delete"))
    assert any("triggers" in p for p in gate.problems())


def test_startup_refuses_real_data_while_the_gate_fails(gate, monkeypatch):
    monkeypatch.setattr(settings, "allow_real_data", True)
    with pytest.raises(RuntimeError, match="not allowed"):
        gate.enforce_real_data_gate()
    monkeypatch.setattr(settings, "allow_real_data", False)
    gate.enforce_real_data_gate()  # demonstration-only mode never needs the gate


def test_health_reports_the_mode(client):
    body = client.get("/api/health").json()
    assert body["mode"] == "demonstration-only" and body["demo"] is True


# ---------- logs (SC-009) ----------
def test_redaction_filter_removes_secrets_emails_and_query_strings():
    f = safe_logging.RedactFilter()
    rec = logging.LogRecord("uvicorn.access", logging.INFO, "", 0, '%s - "%s %s" %d',
                            ("127.0.0.1", "POST", "/api/cases/search?name=Secret+Party&cnr=TNCH019999992025", 200), None)
    assert f.filter(rec)
    out = rec.getMessage()
    assert "Secret" not in out and "TNCH" not in out and "?" not in out
    rec2 = logging.LogRecord("app", logging.INFO, "", 0, 'login failed for alice@example.invalid password="hunter2hunter2" token=abc123', (), None)
    f.filter(rec2)
    assert "alice@" not in rec2.getMessage() and "hunter2" not in rec2.getMessage() and "abc123" not in rec2.getMessage()


def test_no_log_line_from_a_full_scenario_holds_a_password_email_or_party_name(alice, bob, caplog):
    caplog.set_level(logging.DEBUG)
    secret_party = "Zyxwvut Confidential Party"
    m = alice.matter(secret_party)
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "edit"})
    bob.post(f"/matters/{m['id']}/drafts", {"kind": "summary", "title": "t", "body": "body " + secret_party})
    alice.post("/auth/password", {"currentPassword": "wrong wrong wrong wrong", "newPassword": "another long password here"})
    alice.post("/matters", {"title": "x" * 500})
    bob.get(f"/matters/{m['id']}/audit")
    text_out = caplog.text + json.dumps([r.getMessage() for r in caplog.records])
    for secret in (secret_party, PASSWORD, "another long password here", alice.email, bob.email):
        assert secret not in text_out


# ---------- contract (task T086) ----------
def documented_routes() -> set[tuple[str, str]]:
    doc = (Path(__file__).resolve().parents[2] / "specs" / "004-workspace-backend" / "contracts" / "api.md").read_text(encoding="utf-8")
    norm = lambda p: re.sub(r"\{[A-Za-z]+\}", "{}", "/api" + p)  # noqa: E731
    found: set[tuple[str, str]] = set()
    for method, path in re.findall(r"`(GET|POST|PUT|PATCH|DELETE) (/[^`?\s]*)", doc):
        found.add((method, norm(path)))
    for a, b in re.findall(r"`(GET|POST|PUT|PATCH|DELETE)(?:/[A-Z/]+)? ([^`]*)`", doc):
        pass
    # shorthand rows in the "Matter contents" and "Drafts" tables
    for name in ("tasks", "calendar", "documents", "voice-notes", "time-entries", "invoices"):
        base = f"/matters/{{}}/{name}"
        found |= {("GET", norm(base)), ("POST", norm(base)), ("GET", norm(base + "/{}")), ("PATCH", norm(base + "/{}")), ("DELETE", norm(base + "/{}"))}
    found |= {("GET", norm("/matters/{}/drafts")), ("POST", norm("/matters/{}/drafts")), ("GET", norm("/matters/{}/drafts/{}")),
              ("PATCH", norm("/matters/{}/drafts/{}")), ("DELETE", norm("/matters/{}/drafts/{}"))}
    found |= {("GET", norm("/conversations")), ("POST", norm("/conversations")), ("GET", norm("/conversations/{}")), ("POST", norm("/conversations/{}/messages"))}
    found |= {("GET", norm("/intake")), ("POST", norm("/intake")), ("GET", norm("/intake/{}")), ("PATCH", norm("/intake/{}"))}
    return found


def test_the_api_matches_the_contract():
    from app.main import app
    services = {"/api/health", "/api/cases/search", "/api/orders/search", "/api/court-rooms", "/api/cause-lists",
                "/api/caveats/search", "/api/processes/lookup", "/api/locations/find"}
    implemented = {(m.upper(), re.sub(r"\{[A-Za-z_]+\}", "{}", p)) for p, ops in app.openapi()["paths"].items() for m in ops if p not in services}
    documented = {(m, p) for m, p in documented_routes() if p not in services}
    assert implemented - documented == set(), "implemented but not in contracts/api.md"
    assert documented - implemented == set(), "in contracts/api.md but not implemented"


# ---------- bulk demonstration data ----------
def test_bulk_seed_adds_labelled_matters_for_the_owner_and_is_repeatable(sm, alice, client):
    from app.seed.workspace_demo import seed_bulk
    with sm() as db:
        seed_demo(db)
        owner = db.get(Person, alice.person_id)
        assert seed_bulk(db, owner, 100)["created"] == 100
        assert seed_bulk(db, owner, 100)["created"] == 0  # repeat run adds nothing
        mine = db.scalars(select(Matter).where(Matter.created_by == owner.id)).all()
        assert len(mine) == 100 and all(m.is_demo and "(demo)" in m.title for m in mine)
    page = alice.get("/matters?limit=200").json()
    assert len(page["items"]) == 100 and all(m["myLevel"] == "owner" for m in page["items"])
    assert alice.get("/dashboard").json()["matters"] == 100


# ---------- bulk eCourts-style demonstration data ----------
def test_services_bulk_tops_up_to_100_each_and_stays_in_the_demo_courts(sm, client):
    from app.models.services import CaseRow, CaveatRow, CourtRoomRow, ProcessRow
    from app.seed.services_bulk import seed_services_bulk
    with sm() as db:
        first = seed_services_bulk(db, 100)
        assert first["cases"] > 80 and first["caveats"] > 80 and first["processes"] > 80
        assert seed_services_bulk(db, 100) == {"cases": 0, "caveats": 0, "processes": 0}  # repeat adds nothing
        for model in (CaseRow, CaveatRow, ProcessRow):
            assert db.scalar(select(func.count()).select_from(model)) == 100
        rooms = {(r.body["state"], r.body["district"], r.body["complex"], r.body["establishment"]) for r in db.scalars(select(CourtRoomRow))}
        for row in db.scalars(select(CaseRow)):
            c = row.body["court"]
            assert (c["state"], c["district"], c["complex"], c["establishment"]) in rooms
            assert re.fullmatch(r"[A-Z0-9]{16}", row.cnr)
            assert "(demo)" in row.body["petitioner"] or row.body["petitioner"].startswith("State")


def test_the_new_records_can_be_found_through_the_api(sm, client):
    from app.seed.services_bulk import seed_services_bulk
    with sm() as db:
        seed_services_bulk(db, 100)
        from app.models.services import CaseRow
        sample = next(r.body for r in db.scalars(select(CaseRow)) if r.body["petitioner"] == "Sample Party 010 (demo)")
    q = {"mode": "party", "court": sample["court"], "name": "Sample Party 010", "year": sample["year"], "status": "Both"}
    found = client.post("/api/cases/search", json={"query": q}).json()
    assert [c["cnr"] for c in found] == [sample["cnr"]]
    assert client.post("/api/cases/search", json={"query": {"mode": "cnr", "cnr": sample["cnr"]}}).json()[0]["cnr"] == sample["cnr"]
    # a cause list for a hearing date now holds several matters
    room = next(r for r in client.get("/api/court-rooms").json() if r["establishment"] == sample["court"]["establishment"] and r["district"] == sample["court"]["district"])
    rid = "|".join([room["state"], room["district"], room["complex"], room["establishment"], room["number"]])
    kind = "Criminal" if sample["caseType"].startswith("Criminal") else "Civil"
    entries = [e for d in ("2026-10-28", "2026-10-30", "2026-11-05", "2026-11-12", "2026-11-19")
               for e in client.post("/api/cause-lists", json={"roomId": rid, "date": d, "kind": kind}).json()["entries"]]
    assert len(entries) >= 3
    proc = client.post("/api/processes/lookup", json={"processId": "PRC-DEMO-0050", "email": "demo.process.0050@example.invalid"}).json()
    assert proc["process"]["processId"] == "PRC-DEMO-0050" and "email" not in proc["process"]
