from .helpers import ORIGIN


def test_a_changing_request_without_the_csrf_token_is_refused(client, alice):
    h = {"Cookie": alice.headers["Cookie"], "Origin": ORIGIN}
    r = client.post("/api/matters", json={"title": "x"}, headers=h)
    assert r.status_code == 403 and r.json()["code"] == "forbidden"


def test_a_wrong_csrf_token_is_refused(client, alice):
    r = client.post("/api/matters", json={"title": "x"}, headers={**alice.headers, "X-CSRF-Token": "wrong"})
    assert r.status_code == 403


def test_a_foreign_origin_is_refused(client, alice):
    r = client.post("/api/matters", json={"title": "x"}, headers={**alice.headers, "Origin": "http://evil.example"})
    assert r.status_code == 403


def test_reads_do_not_need_the_csrf_token(client, alice):
    r = client.get("/api/matters", headers={"Cookie": alice.headers["Cookie"]})
    assert r.status_code == 200


def test_not_signed_in_is_401(client):
    assert client.get("/api/matters").status_code == 401
    assert client.post("/api/matters", json={"title": "x"}).status_code == 401


def test_services_site_searches_stay_public_and_need_neither(client):
    assert client.get("/api/health").status_code == 200
    r = client.post("/api/cases/search", json={"query": {"mode": "cnr", "cnr": "TNCH019999990000"}})
    assert r.status_code == 200
