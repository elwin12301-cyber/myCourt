"""The gate in front of real client data (research D10, FR-019). `problems()` lists what is missing; start-up refuses
`allow_real_data=true` while the list is not empty."""
from sqlalchemy import text

from ..config import DEFAULT_SECRET, settings
from ..db import engine
from ..models.audit import triggers_present


def problems() -> list[str]:
    found: list[str] = []
    if settings.secret_key == DEFAULT_SECRET or len(settings.secret_key) < 32:
        found.append("MYCOURT_SECRET_KEY must be changed to a random value of at least 32 characters.")
    if not settings.cookie_secure:
        found.append("MYCOURT_COOKIE_SECURE must be true (serve over HTTPS).")
    if settings.session_idle_minutes <= 0 or settings.session_max_hours <= 0:
        found.append("Session limits must be positive.")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            if not triggers_present(conn):
                found.append("The audit_entry triggers are missing: run `python -m app.cli migrate`.")
    except Exception:
        found.append("The database is not reachable, so the audit triggers could not be checked.")
    return found


def enforce_real_data_gate() -> None:
    if not settings.allow_real_data:
        return
    found = problems()
    if found:
        raise RuntimeError("Real client data is not allowed yet:\n - " + "\n - ".join(found))
