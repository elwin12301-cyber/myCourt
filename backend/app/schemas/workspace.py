"""Request bodies for the workspace (contracts/api.md). Limits come from data-model.md."""
import re
from datetime import date, datetime
from typing import Literal

from pydantic import ConfigDict, Field, field_validator

from .services_site import Camel

EMAIL = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
Title = Field(min_length=1, max_length=200)

# ---------- accounts ----------
class RegisterIn(Camel):
    email: str = Field(max_length=254)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(max_length=200)

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        if not EMAIL.match(v):
            raise ValueError("Enter a valid e-mail address.")
        return v.lower()


class LoginIn(Camel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=200)


class PasswordIn(Camel):
    current_password: str = Field(max_length=200)
    new_password: str = Field(max_length=200)


class PersonLookupIn(Camel):
    email: str = Field(max_length=254)


# ---------- matters ----------
class MatterIn(Camel):
    title: str = Title
    client_ref: str = Field(default="", max_length=120)
    status: Literal["open", "on_hold", "closed"] = "open"
    court_case_ref: str = Field(default="", pattern=r"^([A-Z0-9]{16})?$")
    is_demo: bool = True


class MatterPatch(Camel):
    version: int
    title: str | None = Field(default=None, min_length=1, max_length=200)
    client_ref: str | None = Field(default=None, max_length=120)
    status: Literal["open", "on_hold", "closed"] | None = None
    court_case_ref: str | None = Field(default=None, pattern=r"^([A-Z0-9]{16})?$")


class ShareIn(Camel):
    level: Literal["view", "edit", "owner"]


# ---------- matter contents ----------
class TaskIn(Camel):
    title: str = Title
    due: date | None = None
    done: bool = False


class TaskPatch(Camel):
    version: int
    title: str | None = Field(default=None, min_length=1, max_length=200)
    due: date | None = None
    done: bool | None = None


class CalendarIn(Camel):
    kind: Literal["hearing", "deadline", "meeting"]
    title: str = Title
    starts_at: datetime
    ends_at: datetime | None = None
    note: str = Field(default="", max_length=1000)


class CalendarPatch(Camel):
    version: int
    kind: Literal["hearing", "deadline", "meeting"] | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    note: str | None = Field(default=None, max_length=1000)


FILE_TYPES = Literal["pdf", "docx", "image", "text", "spreadsheet", "other"]


class DocumentIn(Camel):
    name: str = Title
    file_type: FILE_TYPES
    extracted_text: str = ""  # size checked in the route so it answers 413
    extraction_confidence: float | None = Field(default=None, ge=0, le=1)


class DocumentPatch(Camel):
    version: int
    name: str | None = Field(default=None, min_length=1, max_length=200)
    file_type: FILE_TYPES | None = None
    extracted_text: str | None = None
    extraction_confidence: float | None = Field(default=None, ge=0, le=1)


class VoiceNoteIn(Camel):
    transcript: str
    language: str = Field(default="en", max_length=20)


class VoiceNotePatch(Camel):
    version: int
    transcript: str | None = None
    language: str | None = Field(default=None, max_length=20)


class TimeEntryIn(Camel):
    worked_on: date
    minutes: int = Field(ge=1, le=1440)
    rate_paise: int = Field(ge=0, le=100_000_000)
    description: str = Field(default="", max_length=500)


class TimeEntryPatch(Camel):
    version: int
    worked_on: date | None = None
    minutes: int | None = Field(default=None, ge=1, le=1440)
    rate_paise: int | None = Field(default=None, ge=0, le=100_000_000)
    description: str | None = Field(default=None, max_length=500)


class LineIn(Camel):
    description: str = Field(min_length=1, max_length=300)
    amount_paise: int = Field(ge=0, le=10_000_000_000)


class InvoiceIn(Camel):
    # A client-sent total is ignored: totals are computed on the server (FR, research D14).
    model_config = ConfigDict(alias_generator=Camel.model_config["alias_generator"], populate_by_name=True, extra="ignore", str_strip_whitespace=True)
    number: str = Field(min_length=1, max_length=40)
    time_entry_ids: list[str] = Field(default_factory=list, max_length=200)
    lines: list[LineIn] = Field(default_factory=list, max_length=200)


class InvoicePatch(Camel):
    model_config = InvoiceIn.model_config
    version: int
    number: str | None = Field(default=None, min_length=1, max_length=40)
    time_entry_ids: list[str] | None = None
    lines: list[LineIn] | None = None


# ---------- drafts and conversations ----------
class SourceIn(Camel):
    label: str = Field(min_length=1, max_length=200)
    reference: str = Field(default="", max_length=500)


DRAFT_KINDS = Literal["summary", "brief", "research", "mapping", "reply", "client_message"]


class DraftIn(Camel):
    kind: DRAFT_KINDS
    title: str = Title
    body: str
    sources: list[SourceIn] = Field(default_factory=list, max_length=50)


class DraftPatch(Camel):
    version: int
    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = None
    sources: list[SourceIn] | None = None


class ConversationIn(Camel):
    title: str = Title
    matter_id: str | None = Field(default=None, max_length=36)


class MessageIn(Camel):
    body: str = Field(min_length=1, max_length=20000)


class QueryIn(Camel):
    query: str = Field(min_length=1, max_length=500)


# ---------- intake ----------
class IntakeIn(Camel):
    prospect_name: str = Field(min_length=1, max_length=200)
    contact: str = Field(default="", max_length=200)
    summary: str = Field(default="", max_length=2000)


class IntakePatch(Camel):
    version: int
    prospect_name: str | None = Field(default=None, min_length=1, max_length=200)
    contact: str | None = Field(default=None, max_length=200)
    summary: str | None = Field(default=None, max_length=2000)


class ConflictConfirmIn(Camel):
    result: Literal["clear", "needs_review"]
    note: str = Field(default="", max_length=1000)
