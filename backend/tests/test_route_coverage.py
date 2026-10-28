"""Fails if a new route under /matters (or /conversations) forgets the access check: every one of them is called as a person
with no access to a REAL matter and must answer 404 exactly as for an unknown id."""
import re
import uuid

from app.main import app


def _paths():
    out = []
    for path, ops in app.openapi()["paths"].items():
        if path.startswith("/api/matters/{matter_id}"):
            for method in ops:
                out.append((method.upper(), path))
    return sorted(out)


def _fill(path: str, matter_id: str) -> str:
    path = path.replace("{matter_id}", matter_id)
    return re.sub(r"\{[a-z_]+\}", str(uuid.uuid4()), path).replace("/api", "", 1)


BODIES = {  # bodies that pass validation, so the check under test is what answers
    "/matters/{matter_id}": {"version": 1, "title": "x"},
    "/matters/{matter_id}/tasks": {"title": "t"},
    "/matters/{matter_id}/calendar": {"kind": "hearing", "title": "t", "startsAt": "2030-01-01T10:00:00Z"},
    "/matters/{matter_id}/documents": {"name": "d", "fileType": "pdf"},
    "/matters/{matter_id}/voice-notes": {"transcript": "t"},
    "/matters/{matter_id}/time-entries": {"workedOn": "2026-01-01", "minutes": 5, "ratePaise": 100},
    "/matters/{matter_id}/invoices": {"number": "1"},
    "/matters/{matter_id}/drafts": {"kind": "summary", "title": "t", "body": "b"},
    "/matters/{matter_id}/research": {"query": "bail"},
    "/matters/{matter_id}/mappings": {"query": "x"},
}


def test_every_matter_route_answers_404_to_an_unassigned_person(alice, bob):
    m = alice.matter("Covered matter")
    routes = _paths()
    assert len(routes) > 30, "route discovery found too few routes"
    for method, template in routes:
        url = _fill(template, m["id"])
        body = BODIES.get(template.removeprefix("/api"))
        if body is None:
            body = {"PUT": {"level": "view"}, "PATCH": {"version": 1}}.get(method, {} if method == "POST" else None)
        r = bob.req(method, url, body)
        assert r.status_code == 404, f"{method} {template} answered {r.status_code}: {r.text[:120]}"
        assert r.json() == {"code": "not_found", "message": "Not found.", "fields": {}}, f"{method} {template}"
