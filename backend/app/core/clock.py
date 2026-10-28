"""One place for the current time, so tests can move it (session expiry, throttle windows)."""
from datetime import datetime, timedelta, timezone

_offset = timedelta(0)


def now() -> datetime:
    return datetime.now(timezone.utc) + _offset


def advance(**kwargs) -> None:
    """Test helper: move the clock forward."""
    global _offset
    _offset += timedelta(**kwargs)


def reset() -> None:
    global _offset
    _offset = timedelta(0)
