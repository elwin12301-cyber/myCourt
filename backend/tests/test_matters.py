import re

from app.config import settings


def test_ids_are_random_uuids(alice):
    ids = {alice.matter(f"m{i}")["id"] for i in range(3)}
    assert len(ids) == 3
    assert all(re.fullmatch(r"[0-9a-f-]{36}", i) for i in ids)


def test_stale_version_gets_409_and_changes_nothing(alice):
    m = alice.matter("Original")
    first = alice.patch(f"/matters/{m['id']}", {"version": 1, "title": "First edit"})
    assert first.status_code == 200 and first.json()["version"] == 2
    stale = alice.patch(f"/matters/{m['id']}", {"version": 1, "title": "Stale edit"})
    assert stale.status_code == 409 and stale.json()["currentVersion"] == 2
    assert alice.get(f"/matters/{m['id']}").json()["title"] == "First edit"


def test_delete_needs_the_title_repeated_and_removes_contents(alice):
    m = alice.matter("Delete me")
    alice.post(f"/matters/{m['id']}/tasks", {"title": "t"})
    assert alice.delete(f"/matters/{m['id']}").status_code == 422
    assert alice.delete(f"/matters/{m['id']}?confirm=wrong").status_code == 422
    assert alice.get(f"/matters/{m['id']}").status_code == 200
    assert alice.delete(f"/matters/{m['id']}?confirm=Delete me").status_code == 200
    assert alice.get(f"/matters/{m['id']}").status_code == 404
    assert alice.get(f"/matters/{m['id']}/tasks").status_code == 404


def test_real_data_is_refused_in_demonstration_mode(alice):
    assert settings.allow_real_data is False
    r = alice.post("/matters", {"title": "Real client", "isDemo": False})
    assert r.status_code == 403
    assert alice.get("/matters").json()["items"] == []


def test_demo_and_real_filter(alice, monkeypatch):
    alice.matter("demo one")
    monkeypatch.setattr(settings, "allow_real_data", True)
    alice.post("/matters", {"title": "real one", "isDemo": False})
    assert [x["title"] for x in alice.get("/matters?isDemo=false").json()["items"]] == ["real one"]
    assert [x["title"] for x in alice.get("/matters?isDemo=true").json()["items"]] == ["demo one"]


def test_validation_does_not_echo_the_submitted_value(alice):
    secret = "S3cretValue" * 30
    r = alice.post("/matters", {"title": secret})
    assert r.status_code == 422 and "S3cretValue" not in r.text
    assert "title" in r.json()["fields"]


def test_pagination(alice):
    for i in range(5):
        alice.matter(f"m{i}")
    page = alice.get("/matters?limit=2").json()
    assert len(page["items"]) == 2 and page["nextCursor"] == "2"
    last = alice.get("/matters?limit=2&cursor=4").json()
    assert len(last["items"]) == 1 and last["nextCursor"] is None
