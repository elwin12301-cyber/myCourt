"""Workspace tables (data-model.md). Every record here is fictional unless the real-data gate is open."""
from datetime import date, datetime
from typing import Any

from sqlalchemy import JSON, Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base
from .base import IdMixin, UTCDateTime, new_id

LEVELS = {"view": 1, "edit": 2, "owner": 3}


class Matter(IdMixin, Base):
    __tablename__ = "matters"
    title: Mapped[str] = mapped_column(String(200))
    client_ref: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[str] = mapped_column(String(12), default="open")  # open, on_hold, closed
    court_case_ref: Mapped[str] = mapped_column(String(16), default="")
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str] = mapped_column(String(36))


class Assignment(Base):
    __tablename__ = "assignments"
    matter_id: Mapped[str] = mapped_column(ForeignKey("matters.id"), primary_key=True)
    person_id: Mapped[str] = mapped_column(ForeignKey("persons.id"), primary_key=True, index=True)
    level: Mapped[str] = mapped_column(String(5))  # view, edit, owner
    granted_by: Mapped[str] = mapped_column(String(36))
    granted_at: Mapped[datetime] = mapped_column(UTCDateTime)


class _MatterChild(IdMixin):
    matter_id: Mapped[str] = mapped_column(ForeignKey("matters.id"), index=True)


class Task(_MatterChild, Base):
    __tablename__ = "tasks"
    title: Mapped[str] = mapped_column(String(200))
    due: Mapped[date | None] = mapped_column(Date, nullable=True)
    done: Mapped[bool] = mapped_column(Boolean, default=False)


class CalendarEntry(_MatterChild, Base):
    __tablename__ = "calendar_entries"
    kind: Mapped[str] = mapped_column(String(10))  # hearing, deadline, meeting
    title: Mapped[str] = mapped_column(String(200))
    starts_at: Mapped[datetime] = mapped_column(UTCDateTime, index=True)
    ends_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    note: Mapped[str] = mapped_column(String(1000), default="")
    approved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


class Document(_MatterChild, Base):
    __tablename__ = "documents"
    name: Mapped[str] = mapped_column(String(200))
    file_type: Mapped[str] = mapped_column(String(20))
    review_status: Mapped[str] = mapped_column(String(14), default="needs_review")
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    extraction_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


class VoiceNote(_MatterChild, Base):
    __tablename__ = "voice_notes"
    transcript: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(20), default="en")
    review_status: Mapped[str] = mapped_column(String(14), default="needs_review")
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


class DraftItem(_MatterChild, Base):
    __tablename__ = "draft_items"
    kind: Mapped[str] = mapped_column(String(14))
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    sources: Mapped[list[Any]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(10), default="draft")  # draft, approved
    generated_by: Mapped[str] = mapped_column(String(14), default="person")  # person, demo_provider
    is_demo_content: Mapped[bool] = mapped_column(Boolean, default=False)


class DraftApproval(Base):
    __tablename__ = "draft_approvals"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    draft_id: Mapped[str] = mapped_column(ForeignKey("draft_items.id"), index=True)
    approved_by: Mapped[str] = mapped_column(String(36))
    approved_at: Mapped[datetime] = mapped_column(UTCDateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


class Conversation(IdMixin, Base):
    __tablename__ = "conversations"
    matter_id: Mapped[str | None] = mapped_column(ForeignKey("matters.id"), nullable=True, index=True)
    person_id: Mapped[str] = mapped_column(ForeignKey("persons.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(10))
    body: Mapped[str] = mapped_column(Text)
    draft_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime)


class IntakeRecord(IdMixin, Base):
    __tablename__ = "intake_records"
    person_id: Mapped[str] = mapped_column(ForeignKey("persons.id"), index=True)
    prospect_name: Mapped[str] = mapped_column(String(200))
    contact: Mapped[str] = mapped_column(String(200), default="")
    summary: Mapped[str] = mapped_column(String(2000), default="")
    conflict_check: Mapped[str] = mapped_column(String(14), default="not_checked")
    conflict_note: Mapped[str] = mapped_column(String(1000), default="")
    confirmed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)
    matter_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class TimeEntry(_MatterChild, Base):
    __tablename__ = "time_entries"
    person_id: Mapped[str] = mapped_column(String(36))
    worked_on: Mapped[date] = mapped_column(Date)
    minutes: Mapped[int] = mapped_column(Integer)
    rate_paise: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(String(500), default="")


class Invoice(_MatterChild, Base):
    __tablename__ = "invoices"
    number: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(10), default="draft")  # draft, approved
    lines: Mapped[list[Any]] = mapped_column(JSON, default=list)  # [{description, amountPaise, timeEntryId?}]
    total_paise: Mapped[int] = mapped_column(Integer, default=0)
    approved_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(UTCDateTime, nullable=True)


# Tables that belong to a matter (deleted with it; the audit trail is kept).
MATTER_CHILD_TABLES = [Task, CalendarEntry, Document, VoiceNote, DraftItem, TimeEntry, Invoice]
