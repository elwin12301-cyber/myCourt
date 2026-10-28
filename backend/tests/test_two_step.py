import time

from app.core import totp

from .helpers import ORIGIN, PASSWORD
from .test_auth import login, register


def code_for(secret: str) -> str:
    return totp._code(secret, int(time.time() // totp.STEP))


def test_totp_matches_the_rfc_6238_test_vector():
    # RFC 6238 appendix B, SHA-1, secret "12345678901234567890", time 59 s -> 94287082 (8 digits); the last 6 are what we use.
    import base64
    secret = base64.b32encode(b"12345678901234567890").decode()
    assert totp._code(secret, 59 // 30) == "287082"


def test_verify_accepts_one_step_either_side_but_not_more():
    s = totp.new_secret()
    now = 1_700_000_000.0
    assert totp.verify(s, totp._code(s, int(now // 30)), now)
    assert totp.verify(s, totp._code(s, int(now // 30) - 1), now)
    assert not totp.verify(s, totp._code(s, int(now // 30) - 3), now)
    assert not totp.verify(s, "abcdef", now) and not totp.verify(s, None, now) and not totp.verify(None, "123456", now)


def enrol(alice):
    secret = alice.post("/auth/mfa/setup").json()["secret"]
    assert alice.post("/auth/mfa/enable", {"code": code_for(secret)}).status_code == 200
    return secret


def test_setup_does_not_turn_it_on_until_a_good_code_is_given(alice, client):
    s = alice.post("/auth/mfa/setup")
    assert s.status_code == 200 and s.json()["otpauthUri"].startswith("otpauth://totp/")
    assert alice.post("/auth/mfa/enable", {"code": "000000"}).status_code == 422
    assert alice.get("/auth/me").json()["person"]["mfaEnabled"] is False


def test_login_needs_the_code_once_two_step_is_on(alice, client, sm):
    register(client)
    r = login(client)  # carol has no two-step yet
    assert r.status_code == 200
    me = client.get("/api/auth/me").json()
    csrf = me["csrfToken"]
    h = {"Origin": ORIGIN, "X-CSRF-Token": csrf}
    secret = client.post("/api/auth/mfa/setup", headers=h).json()["secret"]
    assert client.post("/api/auth/mfa/enable", json={"code": code_for(secret)}, headers=h).status_code == 200
    client.cookies.clear()

    missing = login(client)
    assert missing.status_code == 401 and missing.json()["code"] == "mfa_required"
    wrong = client.post("/api/auth/login", json={"email": "carol@example.invalid", "password": PASSWORD, "code": "000000"}, headers={"Origin": ORIGIN})
    assert wrong.status_code == 401 and wrong.json()["code"] == "not_signed_in"
    right = client.post("/api/auth/login", json={"email": "carol@example.invalid", "password": PASSWORD, "code": code_for(secret)}, headers={"Origin": ORIGIN})
    assert right.status_code == 200 and right.json()["person"]["mfaEnabled"] is True


def test_a_wrong_password_never_hears_about_two_step(alice, client):
    register(client)
    login(client)
    h = {"Origin": ORIGIN, "X-CSRF-Token": client.get("/api/auth/me").json()["csrfToken"]}
    secret = client.post("/api/auth/mfa/setup", headers=h).json()["secret"]
    client.post("/api/auth/mfa/enable", json={"code": code_for(secret)}, headers=h)
    client.cookies.clear()
    r = login(client, password="not the password at all")
    assert r.status_code == 401 and r.json()["code"] == "not_signed_in"


def test_wrong_codes_count_towards_the_sign_in_throttle(client):
    register(client)
    login(client)
    h = {"Origin": ORIGIN, "X-CSRF-Token": client.get("/api/auth/me").json()["csrfToken"]}
    secret = client.post("/api/auth/mfa/setup", headers=h).json()["secret"]
    client.post("/api/auth/mfa/enable", json={"code": code_for(secret)}, headers=h)
    client.cookies.clear()
    body = {"email": "carol@example.invalid", "password": PASSWORD, "code": "111111"}
    codes = [client.post("/api/auth/login", json=body, headers={"Origin": ORIGIN}).status_code for _ in range(7)]
    assert codes[:5] == [401] * 5 and codes[5] == 429


def test_turning_it_off_needs_the_password_and_a_code(alice):
    secret = enrol(alice)
    assert alice.post("/auth/mfa/disable", {"password": "wrong", "code": code_for(secret)}).status_code == 422
    from .helpers import PASSWORD as P
    assert alice.post("/auth/mfa/disable", {"password": P, "code": code_for(secret)}).status_code == 200
    assert alice.get("/auth/me").json()["person"]["mfaEnabled"] is False
