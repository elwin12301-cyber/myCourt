import uuid

import pytest

UNKNOWN = lambda: str(uuid.uuid4())  # noqa: E731


def test_no_access_looks_exactly_like_not_found(alice, bob):
    m = alice.matter("Alice's private matter")
    ghost = UNKNOWN()
    for method, path, body in [
        ("get", "", None), ("patch", "", {"version": 1, "title": "x"}), ("delete", "?confirm=x", None),
        ("get", "/assignments", None), ("get", "/tasks", None), ("get", "/drafts", None), ("get", "/audit", None),
    ]:
        real = getattr(bob, method)(f"/matters/{m['id']}{path}", **({"json": body} if body else {}))
        none = getattr(bob, method)(f"/matters/{ghost}{path}", **({"json": body} if body else {}))
        assert real.status_code == none.status_code == 404, (method, path)
        assert real.json() == none.json(), (method, path)


def test_lists_and_dashboard_show_only_my_matters(alice, bob):
    alice.matter("Alice 1")
    alice.matter("Alice 2")
    bob.matter("Bob 1")
    assert [x["title"] for x in bob.get("/matters").json()["items"]] == ["Bob 1"]
    assert len(alice.get("/matters").json()["items"]) == 2
    assert bob.get("/dashboard").json()["matters"] == 1


def test_view_only_can_read_but_not_change(alice, bob):
    m = alice.matter()
    assert alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "view"}).status_code == 200
    assert bob.get(f"/matters/{m['id']}").status_code == 200
    r = bob.patch(f"/matters/{m['id']}", {"version": 1, "title": "hijack"})
    assert r.status_code == 403
    assert bob.post(f"/matters/{m['id']}/tasks", {"title": "t"}).status_code == 403
    assert alice.get(f"/matters/{m['id']}").json()["title"] == m["title"]


def test_edit_level_can_change_but_not_share_or_delete(alice, bob):
    m = alice.matter()
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "edit"})
    assert bob.post(f"/matters/{m['id']}/tasks", {"title": "t"}).status_code == 201
    assert bob.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "owner"}).status_code == 403
    assert bob.delete(f"/matters/{m['id']}?confirm={m['title']}").status_code == 403


def test_removing_access_takes_effect_on_the_next_request(alice, bob):
    m = alice.matter()
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "edit"})
    assert bob.get(f"/matters/{m['id']}/tasks").status_code == 200
    assert alice.delete(f"/matters/{m['id']}/assignments/{bob.person_id}").status_code == 200
    assert bob.get(f"/matters/{m['id']}/tasks").status_code == 404
    assert bob.get(f"/matters/{m['id']}").status_code == 404


def test_the_last_owner_cannot_be_removed_or_demoted(alice, bob):
    m = alice.matter()
    assert alice.delete(f"/matters/{m['id']}/assignments/{alice.person_id}").status_code == 409
    assert alice.put(f"/matters/{m['id']}/assignments/{alice.person_id}", {"level": "edit"}).status_code == 409
    # with a second owner it is allowed
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "owner"})
    assert alice.delete(f"/matters/{m['id']}/assignments/{alice.person_id}").status_code == 200


def test_children_are_scoped_to_their_matter(alice):
    a, b = alice.matter("A"), alice.matter("B")
    task = alice.post(f"/matters/{a['id']}/tasks", {"title": "only in A"}).json()
    assert alice.get(f"/matters/{b['id']}/tasks/{task['id']}").status_code == 404
    assert alice.patch(f"/matters/{b['id']}/tasks/{task['id']}", {"version": 1, "done": True}).status_code == 404


def test_person_lookup_needs_sign_in_and_uses_a_body(client, alice, bob):
    assert client.post("/api/people/lookup", json={"email": bob.email}).status_code == 401
    r = alice.post("/people/lookup", {"email": bob.email.upper()})
    assert r.status_code == 200 and r.json()["id"] == bob.person_id and "email" not in r.json()
    assert alice.post("/people/lookup", {"email": "nobody@example.invalid"}).status_code == 404
