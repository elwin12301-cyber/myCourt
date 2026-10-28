"""Load check for SC-005 and SC-006: 500 matters, 50 concurrent users.

Run against a THROW-AWAY database and a server using it (it creates fictional users and matters):

    # terminal 1 (backend/)
    set MYCOURT_DATABASE_URL=postgresql+psycopg://mycourt:mycourt@127.0.0.1:5433/mycourt_load
    python -m app.cli migrate
    uvicorn app.main:app --port 8001
    # terminal 2 (backend/)
    set MYCOURT_DATABASE_URL=...same...
    python ../scripts/load_check.py --base http://127.0.0.1:8001

Reports the 95th percentile of the dashboard, matter list, save and search calls. Needs httpx (the `dev` extra).
"""
import argparse
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import httpx  # noqa: E402

from app.core import clock  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.core.sessions import COOKIE, create_session  # noqa: E402
from app.db import SessionLocal  # noqa: E402
from app.models.accounts import Person  # noqa: E402
from app.models.workspace import Assignment, Matter  # noqa: E402

USERS, MATTERS_PER_USER = 50, 10


def prepare() -> list[dict]:
    """500 fictional matters spread over 50 fictional users, each user with a live session."""
    pw = hash_password("load-check-not-a-real-password")
    out = []
    with SessionLocal() as db:
        for u in range(USERS):
            p = Person(email=f"load.user.{u}@example.invalid", display_name=f"Load User {u}", password_hash=pw)
            db.add(p)
            db.flush()
            for m in range(MATTERS_PER_USER):
                mt = Matter(title=f"Load matter {u}-{m} (demo)", is_demo=True, created_by=p.id)
                db.add(mt)
                db.flush()
                db.add(Assignment(matter_id=mt.id, person_id=p.id, level="owner", granted_by=p.id, granted_at=clock.now()))
            token, row = create_session(db, p)
            out.append({"token": token, "csrf": row.csrf_token})
        db.commit()
        ids = {i: [m.id for m in db.query(Matter).filter(Matter.created_by == db.query(Person.id).filter(Person.email == f"load.user.{i}@example.invalid").scalar_subquery()).limit(1)] for i in range(USERS)}
    for i, u in enumerate(out):
        u["matter"] = ids[i][0]
    return out


def session_user(base: str, u: dict, rounds: int) -> list[tuple[str, float]]:
    headers = {"Cookie": f"{COOKIE}={u['token']}", "X-CSRF-Token": u["csrf"], "Origin": "http://localhost:5173"}
    times: list[tuple[str, float]] = []
    with httpx.Client(base_url=base, headers=headers, timeout=30) as c:
        def timed(name, fn):
            t = time.perf_counter()
            r = fn()
            times.append((name, time.perf_counter() - t))
            if r.status_code >= 400:
                times.append(("ERROR " + name + f" {r.status_code}", 0.0))
        for i in range(rounds):
            timed("dashboard", lambda: c.get("/api/dashboard"))
            timed("list matters", lambda: c.get("/api/matters?limit=50"))
            timed("save task", lambda: c.post(f"/api/matters/{u['matter']}/tasks", json={"title": f"task {i}"}))
            timed("search (research)", lambda: c.post(f"/api/matters/{u['matter']}/research", json={"query": "bail bond"}))
    return times


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8001")
    ap.add_argument("--rounds", type=int, default=10)
    args = ap.parse_args()
    print(f"Preparing {USERS} users and {USERS * MATTERS_PER_USER} matters ...")
    users = prepare()
    print("Running ...")
    start = time.perf_counter()
    with ThreadPoolExecutor(USERS) as pool:
        results = [t for chunk in pool.map(lambda u: session_user(args.base, u, args.rounds), users) for t in chunk]
    wall = time.perf_counter() - start
    errors = [n for n, _ in results if n.startswith("ERROR")]
    by: dict[str, list[float]] = {}
    for n, s in results:
        if not n.startswith("ERROR"):
            by.setdefault(n, []).append(s)
    everything = sorted(s for v in by.values() for s in v)
    p95 = lambda xs: sorted(xs)[max(0, int(len(xs) * 0.95) - 1)]  # noqa: E731
    print(f"{len(everything)} requests in {wall:.1f}s, {len(errors)} errors")
    for n, v in by.items():
        print(f"  {n:20s} median {statistics.median(v) * 1000:7.0f} ms   p95 {p95(v) * 1000:7.0f} ms   max {max(v) * 1000:7.0f} ms")
    ok_dash = p95(by["dashboard"]) < 3.0
    ok_all = p95(everything) < 2.0
    print(f"SC-005 dashboard p95 under 3 s: {'PASS' if ok_dash else 'FAIL'}")
    print(f"SC-006 all requests p95 under 2 s: {'PASS' if ok_all else 'FAIL'}")
    return 0 if ok_dash and ok_all and not errors else 1


if __name__ == "__main__":
    sys.exit(main())
