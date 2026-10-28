import json

from app.core import clock

from .helpers import ORIGIN, PASSWORD


def register(client, email="carol@example.invalid", password=PASSWORD):
    return client.post("/api/auth/register", json={"email": email, "displayName": "Carol", "password": password}, headers={"Origin": ORIGIN})


def login(client, email="carol@example.invalid", password=PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password}, headers={"Origin": ORIGIN})


def test_register_gives_the_same_answer_for_new_and_existing_addresses(client):
    first = register(client)
    again = register(client)
    assert first.status_code == again.status_code == 202
    assert first.json() == again.json()


def test_weak_password_is_rejected(client):
    r = register(client, password="short")
    assert r.status_code == 422 and "password" in r.json()["fields"]


def test_login_sets_an_httponly_cookie_and_returns_a_csrf_token(client):
    register(client)
    r = login(client)
    assert r.status_code == 200
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie
    assert r.json()["csrfToken"] and r.json()["person"]["email"] == "carol@example.invalid"
    assert "password" not in json.dumps(r.json()).lower()


def test_me_works_after_login_and_not_after_logout(client):
    register(client)
    csrf = login(client).json()["csrfToken"]
    assert client.get("/api/auth/me").status_code == 200
    out = client.post("/api/auth/logout", headers={"X-CSRF-Token": csrf, "Origin": ORIGIN})
    assert out.status_code == 200
    client.cookies.clear()  # the browser would drop the deleted cookie
    assert client.get("/api/auth/me").status_code == 401


def test_every_sign_in_failure_looks_identical(client, sm):
    register(client)
    wrong = login(client, password="not the password at all")
    unknown = login(client, email="nobody@example.invalid")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()
    # a deactivated account gives the same answer too
    from app.models.accounts import Person
    from sqlalchemy import select
    with sm() as db:
        p = db.scalars(select(Person).where(Person.email == "carol@example.invalid")).first()
        p.active = False
        db.commit()
    gone = login(client)
    assert gone.status_code == 401 and gone.json() == wrong.json()


def test_a_deactivated_person_loses_access_at_once(client, sm, alice):
    from app.models.accounts import Person
    with sm() as db:
        db.get(Person, alice.person_id).active = False
        db.commit()
    assert alice.get("/auth/me").status_code == 401


def test_password_change_ends_other_sessions(client, sm, alice):
    from .helpers import make_actor
    from app.core.sessions import create_session
    from app.models.accounts import Person
    with sm() as db:
        other_token, _ = create_session(db, db.get(Person, alice.person_id))
        db.commit()
    r = alice.post("/auth/password", {"currentPassword": PASSWORD, "newPassword": "a brand new long password"})
    assert r.status_code == 200
    assert alice.get("/auth/me").status_code == 200
    stale = client.get("/api/auth/me", headers={"Cookie": f"mycourt_session={other_token}"})
    assert stale.status_code == 401


def test_password_change_needs_the_current_password(alice):
    r = alice.post("/auth/password", {"currentPassword": "wrong wrong wrong", "newPassword": "a brand new long password"})
    assert r.status_code == 422


def test_idle_session_expires(client, alice):
    assert alice.get("/auth/me").status_code == 200
    clock.advance(minutes=31)
    assert alice.get("/auth/me").status_code == 401


def test_activity_keeps_a_session_alive_but_not_past_the_absolute_limit(client, alice):
    for _ in range(25):  # 25 x 29 minutes of activity = just over 12 hours
        clock.advance(minutes=29)
        status = alice.get("/auth/me").status_code
        if status == 401:
            break
    assert status == 401


def test_only_an_operator_can_deactivate(client, sm, alice, bob, monkeypatch):
    from app.config import settings
    assert alice.post(f"/admin/people/{bob.person_id}/deactivate").status_code == 403
    monkeypatch.setattr(settings, "operator_emails", [alice.email])
    assert alice.post(f"/admin/people/{bob.person_id}/deactivate").status_code == 200
    assert bob.get("/auth/me").status_code == 401
