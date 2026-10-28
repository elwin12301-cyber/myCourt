from app.core import clock

from .helpers import ORIGIN, PASSWORD
from .test_auth import login, register


def test_six_failures_in_the_window_lock_further_attempts_with_a_generic_answer(client):
    register(client)
    for _ in range(5):
        assert login(client, password="wrong wrong wrong wrong").status_code == 401
    blocked = login(client)  # even the right password is refused while locked
    assert blocked.status_code == 429 and blocked.json()["code"] == "too_many_attempts"
    unknown = login(client, email="who@example.invalid")  # same client address: same answer for any account
    assert unknown.status_code == 429 and unknown.json() == blocked.json()


def test_the_lock_ends_after_the_window(client):
    register(client)
    for _ in range(5):
        login(client, password="wrong wrong wrong wrong")
    assert login(client).status_code == 429
    clock.advance(minutes=16)
    assert login(client).status_code == 200


def test_throttle_records_do_not_hold_the_address_or_email(client, sm):
    register(client)
    login(client, password="wrong wrong wrong wrong")
    from sqlalchemy import select
    from app.models.accounts import LoginAttempt
    with sm() as db:
        rows = db.scalars(select(LoginAttempt)).all()
    assert rows and all("carol" not in r.email_hash and "testclient" not in r.client_hash for r in rows)
