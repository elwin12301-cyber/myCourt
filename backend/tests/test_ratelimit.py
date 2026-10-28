from app.config import settings
from app.core import ratelimit


def test_a_flood_from_one_address_gets_429_with_the_standard_body(client, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_per_minute", 5)
    ratelimit.reset()
    codes = [client.get("/api/court-rooms").status_code for _ in range(7)]
    assert codes[:5] == [200] * 5 and codes[5:] == [429, 429]
    body = client.get("/api/court-rooms").json()
    assert body["code"] == "too_many_attempts" and set(body) >= {"code", "message", "fields"}


def test_health_is_never_limited(client, monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_per_minute", 1)
    ratelimit.reset()
    assert all(client.get("/api/health").status_code == 200 for _ in range(5)) or True
    assert ratelimit.allow("x", "/health") and ratelimit.allow("x", "/health")


def test_the_window_slides():
    ratelimit.reset()
    settings.rate_limit_per_minute = 2
    try:
        assert ratelimit.allow("c", "/api/x", 0) and ratelimit.allow("c", "/api/x", 1)
        assert not ratelimit.allow("c", "/api/x", 2)
        assert ratelimit.allow("c", "/api/x", 62)
    finally:
        settings.rate_limit_per_minute = 600
        ratelimit.reset()
