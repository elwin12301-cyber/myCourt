from dataclasses import dataclass, field

from app.core.security import hash_password
from app.core.sessions import COOKIE, create_session
from app.models.accounts import Person

PASSWORD = "correct horse battery staple"
_HASH = hash_password(PASSWORD)  # hashed once: scrypt is deliberately slow
ORIGIN = "http://localhost:5173"


@dataclass
class Actor:
    """A signed-in person. Requests carry the session cookie and CSRF token explicitly, so several people can act in one test."""
    client: object
    person_id: str
    email: str
    token: str
    csrf: str
    extra: dict = field(default_factory=dict)

    @property
    def headers(self) -> dict:
        return {"Cookie": f"{COOKIE}={self.token}", "X-CSRF-Token": self.csrf, "Origin": ORIGIN}

    def req(self, method: str, path: str, json=None, **kw):
        return self.client.request(method, "/api" + path, json=json, headers={**self.headers, **kw.pop("headers", {})}, **kw)

    def get(self, path, **kw): return self.req("GET", path, **kw)
    def post(self, path, json=None, **kw): return self.req("POST", path, json, **kw)
    def put(self, path, json=None, **kw): return self.req("PUT", path, json, **kw)
    def patch(self, path, json=None, **kw): return self.req("PATCH", path, json, **kw)
    def delete(self, path, **kw): return self.req("DELETE", path, **kw)

    def matter(self, title="Sample matter (demo)", **extra) -> dict:
        r = self.post("/matters", {"title": title, **extra})
        assert r.status_code == 201, r.text
        return r.json()


def make_actor(client, sm, email: str, name: str) -> Actor:
    with sm() as db:
        p = Person(email=email, display_name=name, password_hash=_HASH)
        db.add(p)
        db.flush()
        token, row = create_session(db, p)
        db.commit()
        return Actor(client, p.id, email, token, row.csrf_token)
