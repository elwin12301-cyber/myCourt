from datetime import date, datetime
from typing import Any

from pydantic.alias_generators import to_camel


def serialize(obj: Any, exclude: tuple[str, ...] = (), **extra: Any) -> dict[str, Any]:
    """Row to camelCase JSON-friendly dict."""
    out: dict[str, Any] = {}
    for col in obj.__table__.columns:
        if col.name in exclude:
            continue
        v = getattr(obj, col.name)
        if isinstance(v, datetime):
            v = v.isoformat()
        elif isinstance(v, date):
            v = v.isoformat()
        out[to_camel(col.name)] = v
    out.update(extra)
    return out
