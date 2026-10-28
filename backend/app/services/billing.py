"""Money is integer paise; totals are computed here from entries (research D14)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.errors import Invalid
from ..models.workspace import TimeEntry


def amount_for(minutes: int, rate_paise_per_hour: int) -> int:
    """Rounded half up to a whole paisa."""
    return (minutes * rate_paise_per_hour * 2 + 60) // 120


def compute_lines(db: Session, matter_id: str, time_entry_ids: list[str], extra_lines: list[dict]) -> list[dict]:
    lines: list[dict] = []
    if time_entry_ids:
        found = {e.id: e for e in db.scalars(select(TimeEntry).where(TimeEntry.matter_id == matter_id, TimeEntry.id.in_(time_entry_ids)))}
        missing = [i for i in time_entry_ids if i not in found]
        if missing:
            raise Invalid(fields={"timeEntryIds": "Every time entry must belong to this matter."})
        for i in time_entry_ids:
            e = found[i]
            lines.append({"description": e.description or "Time", "amountPaise": amount_for(e.minutes, e.rate_paise), "timeEntryId": e.id})
    for line in extra_lines:
        lines.append({"description": line["description"], "amountPaise": line["amount_paise"]})
    return lines
