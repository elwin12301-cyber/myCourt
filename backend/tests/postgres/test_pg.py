"""Run with PostgreSQL up (docker compose up -d --wait):  python -m pytest -m postgres
Uses its own throw-away database, `mycourt_test`, created and dropped here."""
import os
import threading

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, select, text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import sessionmaker

from app.db import get_session
from app.main import app
from app.migrate import upgrade
from app.models.audit import AuditEntry, triggers_present
from app.models.workspace import Invoice, Matter

from ..helpers import make_actor

pytestmark = pytest.mark.postgres

ADMIN = os.environ.get("MYCOURT_TEST_POSTGRES_URL", "postgresql://mycourt:mycourt@127.0.0.1:5433/mycourt")
TEST_DB = "mycourt_test"


@pytest.fixture(scope="module")
def maker():
    with psycopg.connect(ADMIN, autocommit=True, connect_timeout=8) as admin:
        admin.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
        admin.execute(f"CREATE DATABASE {TEST_DB}")
    url = ADMIN.replace("postgresql://", "postgresql+psycopg://").rsplit("/", 1)[0] + f"/{TEST_DB}"
    upgrade(url)
    engine = create_engine(url, pool_size=10)
    yield sessionmaker(bind=engine, expire_on_commit=False)
    engine.dispose()
    with psycopg.connect(ADMIN, autocommit=True, connect_timeout=8) as admin:
        admin.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")


@pytest.fixture()
def api(maker):
    def override():
        with maker() as s:
            yield s

    app.dependency_overrides[get_session] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_migrations_install_the_audit_triggers_and_they_block_changes(maker):
    with maker() as db:
        assert triggers_present(db.connection())
        db.commit()
    with maker() as db:
        db.add(AuditEntry(id="00000000-0000-0000-0000-000000000001", time=__import__("datetime").datetime.now(), action="view", hash="x"))
        db.commit()
    for sql in ("UPDATE audit_entry SET action = 'delete'", "DELETE FROM audit_entry"):
        with maker() as db:
            with pytest.raises(DBAPIError, match="append-only"):
                db.execute(text(sql))
                db.commit()


def test_two_simultaneous_edits_give_one_success_and_one_conflict(api, maker):
    alice = make_actor(api, maker, "pg.alice@example.invalid", "Alice")
    m = alice.matter("Contended matter")
    results: list[int] = []
    barrier = threading.Barrier(2)

    def edit(title: str):
        barrier.wait()
        results.append(alice.patch(f"/matters/{m['id']}", {"version": 1, "title": title}).status_code)

    threads = [threading.Thread(target=edit, args=(t,)) for t in ("First", "Second")]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert sorted(results) == [200, 409], results
    with maker() as db:
        row = db.get(Matter, m["id"])
        assert row.version == 2 and row.title in ("First", "Second")


def test_a_failed_request_leaves_no_partial_rows(api, maker):
    alice = make_actor(api, maker, "pg.bob@example.invalid", "Bob")
    a, b = alice.matter("A"), alice.matter("B")
    other = alice.post(f"/matters/{b['id']}/time-entries", {"workedOn": "2026-01-01", "minutes": 10, "ratePaise": 600}).json()
    with maker() as db:
        before_inv = db.scalar(select(func.count()).select_from(Invoice))
        before_audit = db.scalar(select(func.count()).select_from(AuditEntry).where(AuditEntry.matter_id == a["id"]))
    assert alice.post(f"/matters/{a['id']}/invoices", {"number": "1", "timeEntryIds": [other["id"]]}).status_code == 422
    with maker() as db:
        assert db.scalar(select(func.count()).select_from(Invoice)) == before_inv
        assert db.scalar(select(func.count()).select_from(AuditEntry).where(AuditEntry.matter_id == a["id"])) == before_audit


def test_the_audit_chain_stays_valid_under_concurrent_writes(api, maker):
    alice = make_actor(api, maker, "pg.carol@example.invalid", "Carol")
    m = alice.matter("Busy matter")
    errors = []

    def work(i: int):
        r = alice.post(f"/matters/{m['id']}/tasks", {"title": f"t{i}"})
        if r.status_code != 201:
            errors.append(r.status_code)

    threads = [threading.Thread(target=work, args=(i,)) for i in range(8)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert errors == []
    assert alice.get(f"/matters/{m['id']}/audit/verify").json()["ok"] is True
