"""General request limit per client address: a sliding one-minute window kept in memory.

The sign-in throttle (core/throttle.py) stays the control for password guessing; this one only slows a client that
floods the API. It is per process, which is enough for the one-server scale this release targets.
"""
import time
from collections import defaultdict, deque

from ..config import settings

_hits: dict[str, deque] = defaultdict(deque)
EXEMPT = ("/health", "/api/health")


def allow(client: str, path: str, now: float | None = None) -> bool:
    limit = settings.rate_limit_per_minute
    if limit <= 0 or path.rstrip("/") in EXEMPT:
        return True
    now = time.monotonic() if now is None else now
    q = _hits[client]
    while q and q[0] <= now - 60:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True


def reset() -> None:
    _hits.clear()
