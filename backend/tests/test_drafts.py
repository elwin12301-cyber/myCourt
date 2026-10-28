import socket

import pytest

NOTHING = "Nothing found in the sources searched."


def make_draft(actor, mid, **kw):
    r = actor.post(f"/matters/{mid}/drafts", {"kind": "summary", "title": "Summary", "body": "Body", **kw})
    assert r.status_code == 201, r.text
    return r.json()


def test_every_draft_carries_status_sources_and_label(alice):
    m = alice.matter()
    d = make_draft(alice, m["id"])
    assert d["status"] == "draft" and d["sources"] == [] and "advocate verification" in d["label"]
    assert alice.get(f"/matters/{m['id']}/drafts/{d['id']}").json()["status"] == "draft"
    assert alice.get(f"/matters/{m['id']}/drafts").json()["items"][0]["status"] == "draft"


def test_only_someone_with_edit_access_can_approve(alice, bob):
    m = alice.matter()
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "view"})
    d = make_draft(alice, m["id"])
    assert bob.post(f"/matters/{m['id']}/drafts/{d['id']}/approve").status_code == 403
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "edit"})
    ok = bob.post(f"/matters/{m['id']}/drafts/{d['id']}/approve")
    assert ok.status_code == 200 and ok.json()["status"] == "approved"
    assert ok.json()["approvals"][0]["approvedBy"] == bob.person_id


def test_editing_an_approved_draft_returns_it_to_draft_and_keeps_the_history(alice):
    m = alice.matter()
    d = make_draft(alice, m["id"])
    approved = alice.post(f"/matters/{m['id']}/drafts/{d['id']}/approve").json()
    edited = alice.patch(f"/matters/{m['id']}/drafts/{d['id']}", {"version": approved["version"], "body": "Changed"}).json()
    assert edited["status"] == "draft"
    assert len(edited["approvals"]) == 1 and edited["approvals"][0]["revokedAt"]
    again = alice.post(f"/matters/{m['id']}/drafts/{d['id']}/approve").json()
    assert again["status"] == "approved" and len(again["approvals"]) == 2


def test_draft_edit_conflict(alice):
    m = alice.matter()
    d = make_draft(alice, m["id"])
    alice.patch(f"/matters/{m['id']}/drafts/{d['id']}", {"version": 1, "title": "A"})
    assert alice.patch(f"/matters/{m['id']}/drafts/{d['id']}", {"version": 1, "title": "B"}).status_code == 409


def test_generated_output_is_labelled_as_demonstration_draft(alice):
    m = alice.matter()
    r = alice.post(f"/matters/{m['id']}/mappings", {"query": "any section"}).json()
    assert r["status"] == "draft" and r["isDemoContent"] is True and r["generatedBy"] == "demo_provider"
    assert "not legal advice" in r["body"].lower()


def test_research_with_no_hits_says_nothing_found_and_never_that_none_exists(alice):
    m = alice.matter()
    r = alice.post(f"/matters/{m['id']}/research", {"query": "zzzz qqqq"}).json()
    assert r["sources"] == [] and r["body"] == NOTHING
    for banned in ("no such", "does not exist", "no authority exists"):
        assert banned not in r["body"].lower()


def test_research_with_hits_lists_fictional_sources(alice):
    m = alice.matter()
    r = alice.post(f"/matters/{m['id']}/research", {"query": "bail bond"}).json()
    assert r["sources"] and all("(demo)" in s["label"] for s in r["sources"]) and r["status"] == "draft"


def test_conversations_are_private_and_replies_are_demo_drafts(alice, bob):
    m = alice.matter()
    c = alice.post("/conversations", {"title": "Chat", "matterId": m["id"]}).json()
    out = alice.post(f"/conversations/{c['id']}/messages", {"body": "Summarise the matter"}).json()
    assert [x["role"] for x in out["messages"]] == ["user", "assistant"] and out["isDemoContent"] is True
    drafts = alice.get(f"/matters/{m['id']}/drafts").json()["items"]
    assert drafts[0]["kind"] == "reply" and drafts[0]["status"] == "draft"
    assert bob.get(f"/conversations/{c['id']}").status_code == 404
    assert bob.post(f"/conversations/{c['id']}/messages", {"body": "x"}).status_code == 404


def test_a_conversation_cannot_be_attached_to_someone_elses_matter(alice, bob):
    m = alice.matter()
    assert bob.post("/conversations", {"title": "x", "matterId": m["id"]}).status_code == 404


def test_no_outbound_network_is_used(alice, monkeypatch):
    """The assistant, research, mapping and voice routes must work with every socket connection refused."""
    real_connect = socket.socket.connect

    def refuse(self, address, *a, **k):
        host = address[0] if isinstance(address, tuple) else str(address)
        if host not in ("127.0.0.1", "::1", "localhost"):  # loopback is the test client's own plumbing
            raise AssertionError(f"outbound network call attempted to {host}")
        return real_connect(self, address, *a, **k)

    monkeypatch.setattr(socket.socket, "connect", refuse)
    m = alice.matter()
    alice.post(f"/matters/{m['id']}/research", {"query": "bail"})
    alice.post(f"/matters/{m['id']}/mappings", {"query": "x"})
    c = alice.post("/conversations", {"title": "t", "matterId": m["id"]}).json()
    assert alice.post(f"/conversations/{c['id']}/messages", {"body": "hi"}).status_code == 201
    assert alice.post(f"/matters/{m['id']}/voice-notes", {"transcript": "dictated text"}).status_code == 201


def test_no_http_client_is_imported_by_the_application():
    import pathlib
    import re
    root = pathlib.Path(__file__).resolve().parent.parent / "app"
    offenders = [str(p) for p in root.rglob("*.py") if re.search(r"^\s*(import|from)\s+(requests|httpx|urllib3|aiohttp)\b", p.read_text(encoding="utf-8"), re.M)]
    assert offenders == []
