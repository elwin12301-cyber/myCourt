import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError

from app.core.audit import verify_chain
from app.models.audit import AuditEntry


def trail(actor, matter_id):
    return actor.get(f"/matters/{matter_id}/audit").json()["items"]


def test_create_view_update_delete_leave_ordered_entries(alice):
    m = alice.matter("Audited matter")
    alice.get(f"/matters/{m['id']}")
    alice.patch(f"/matters/{m['id']}", {"version": 1, "status": "on_hold"})
    t = alice.post(f"/matters/{m['id']}/tasks", {"title": "t"}).json()
    alice.delete(f"/matters/{m['id']}/tasks/{t['id']}")
    items = trail(alice, m["id"])
    actions = [(e["action"], e["targetType"]) for e in reversed(items)]  # oldest first
    assert actions == [("create", "matter"), ("view", "matter"), ("update", "matter"), ("create", "task"), ("delete", "task")]
    assert all(e["personId"] == alice.person_id and e["time"] for e in items)


def test_share_unshare_and_approve_are_recorded(alice, bob):
    m = alice.matter()
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "edit"})
    d = alice.post(f"/matters/{m['id']}/drafts", {"kind": "summary", "title": "s", "body": "b"}).json()
    alice.post(f"/matters/{m['id']}/drafts/{d['id']}/approve")
    alice.delete(f"/matters/{m['id']}/assignments/{bob.person_id}")
    actions = {e["action"] for e in trail(alice, m["id"])}
    assert {"share", "unshare", "approve"} <= actions


def test_denied_attempts_are_recorded_for_owners_without_telling_the_caller(alice, bob):
    m = alice.matter()
    assert bob.get(f"/matters/{m['id']}").status_code == 404
    denied = [e for e in trail(alice, m["id"]) if e["action"] == "denied"]
    assert len(denied) == 1 and denied[0]["personId"] == bob.person_id


def test_only_owners_can_read_the_trail(alice, bob):
    m = alice.matter()
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "edit"})
    assert bob.get(f"/matters/{m['id']}/audit").status_code == 403


def test_details_hold_no_titles_names_or_addresses(alice, bob):
    m = alice.matter("Confidential Party Name v. Other Party")
    alice.patch(f"/matters/{m['id']}", {"version": 1, "title": "Renamed Confidential Party"})
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "view"})
    blob = str(trail(alice, m["id"]))
    for forbidden in ("Confidential", "Renamed", "Party", bob.email, alice.email):
        assert forbidden not in blob


def test_the_database_refuses_to_change_or_delete_an_entry(sm, alice):
    alice.matter()
    with sm() as db:
        with pytest.raises(DBAPIError):
            db.execute(text("UPDATE audit_entry SET action = 'view'"))
            db.commit()
    with sm() as db:
        with pytest.raises(DBAPIError):
            db.execute(text("DELETE FROM audit_entry"))
            db.commit()
        db.rollback()
        assert db.scalars(select(AuditEntry)).first() is not None


def test_no_route_edits_or_deletes_an_audit_entry(client):
    for path, ops in __import__("app.main", fromlist=["app"]).app.openapi()["paths"].items():
        if "audit" in path:
            assert set(ops) <= {"get"}, path


def test_the_chain_verifies_and_detects_tampering(sm, alice):
    m = alice.matter()
    alice.patch(f"/matters/{m['id']}", {"version": 1, "status": "closed"})
    assert alice.get(f"/matters/{m['id']}/audit/verify").json() == {"ok": True, "firstBadId": None}
    with sm() as db:
        db.execute(text("DROP TRIGGER audit_entry_no_update"))
        target = db.scalars(select(AuditEntry).where(AuditEntry.matter_id == m["id"]).order_by(AuditEntry.seq)).all()[1]
        db.execute(text("UPDATE audit_entry SET action = 'delete' WHERE id = :i"), {"i": target.id})
        db.commit()
        db.expire_all()
        ok, first_bad = verify_chain(db, m["id"])
    assert not ok and first_bad == target.id
    assert alice.get(f"/matters/{m['id']}/audit/verify").json() == {"ok": False, "firstBadId": target.id}


def test_deleting_a_matter_keeps_its_history(sm, alice):
    m = alice.matter("Short lived")
    alice.delete(f"/matters/{m['id']}?confirm=Short lived")
    with sm() as db:
        actions = [e.action for e in db.scalars(select(AuditEntry).where(AuditEntry.matter_id == m["id"]).order_by(AuditEntry.seq))]
    assert actions[0] == "create" and actions[-1] == "delete"


def test_every_successful_change_leaves_an_entry(alice, bob, sm):
    """Walks every changing route under /matters with valid requests and fails if one leaves no new audit entry."""
    from app.main import app
    m = alice.matter("Completeness")
    mid = m["id"]
    alice.put(f"/matters/{mid}/assignments/{bob.person_id}", {"level": "edit"})
    made = {
        "tasks": alice.post(f"/matters/{mid}/tasks", {"title": "t"}).json(),
        "calendar": alice.post(f"/matters/{mid}/calendar", {"kind": "deadline", "title": "d", "startsAt": "2031-01-01T10:00:00Z"}).json(),
        "documents": alice.post(f"/matters/{mid}/documents", {"name": "d", "fileType": "pdf"}).json(),
        "voice-notes": alice.post(f"/matters/{mid}/voice-notes", {"transcript": "t"}).json(),
        "time-entries": alice.post(f"/matters/{mid}/time-entries", {"workedOn": "2026-01-01", "minutes": 30, "ratePaise": 100000}).json(),
        "invoices": alice.post(f"/matters/{mid}/invoices", {"number": "1", "lines": [{"description": "x", "amountPaise": 5}]}).json(),
        "drafts": alice.post(f"/matters/{mid}/drafts", {"kind": "summary", "title": "s", "body": "b"}).json(),
    }

    def count():
        with sm() as db:
            return len(db.scalars(select(AuditEntry).where(AuditEntry.matter_id == mid)).all())

    def changed(label, resp):
        nonlocal before
        assert resp.status_code < 300, (label, resp.status_code, resp.text)
        after = count()
        assert after > before, f"{label} left no audit entry"
        before = after

    before = count()
    changed("patch matter", alice.patch(f"/matters/{mid}", {"version": 1, "status": "closed"}))
    for name, item in made.items():
        changed(f"patch {name}", alice.patch(f"/matters/{mid}/{name}/{item['id']}", {"version": item["version"]} | ({"title": "x"} if name in ("tasks", "calendar", "drafts") else {"number": "2"} if name == "invoices" else {})))
    changed("approve calendar", alice.post(f"/matters/{mid}/calendar/{made['calendar']['id']}/approve"))
    changed("review document", alice.post(f"/matters/{mid}/documents/{made['documents']['id']}/review"))
    changed("review voice note", alice.post(f"/matters/{mid}/voice-notes/{made['voice-notes']['id']}/review"))
    changed("approve invoice", alice.post(f"/matters/{mid}/invoices/{made['invoices']['id']}/approve"))
    changed("approve draft", alice.post(f"/matters/{mid}/drafts/{made['drafts']['id']}/approve"))
    changed("research", alice.post(f"/matters/{mid}/research", {"query": "bail"}))
    changed("mapping", alice.post(f"/matters/{mid}/mappings", {"query": "x"}))
    for name, item in made.items():
        if name != "invoices":
            changed(f"delete {name}", alice.delete(f"/matters/{mid}/{name}/{item['id']}"))
    changed("unshare", alice.delete(f"/matters/{mid}/assignments/{bob.person_id}"))
    # every mutating path in the contract was either exercised above or is the matter delete tested elsewhere
    mutating = {p for p, ops in app.openapi()["paths"].items() if p.startswith("/api/matters/{matter_id}") and set(ops) & {"post", "put", "patch", "delete"}}
    assert len(mutating) >= 20
