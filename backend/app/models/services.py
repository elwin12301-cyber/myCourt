"""Tables. Each row keeps the searchable court columns and the whole record as JSON (the shape the front end uses).

Every record is fictional demonstration data. Nothing here may be loaded from, or sent to, a real court system.
"""
from typing import Any

from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..db import Base


class CourtColumns:
    state: Mapped[str] = mapped_column(String(80), index=True)
    district: Mapped[str] = mapped_column(String(80), index=True)
    complex: Mapped[str] = mapped_column(String(120), index=True)
    establishment: Mapped[str] = mapped_column(String(120), default="")


class CaseRow(CourtColumns, Base):
    __tablename__ = "cases"
    cnr: Mapped[str] = mapped_column(String(24), primary_key=True)
    body: Mapped[dict[str, Any]] = mapped_column(JSON)


class CourtRoomRow(CourtColumns, Base):
    __tablename__ = "court_rooms"
    id: Mapped[str] = mapped_column(String(400), primary_key=True)
    body: Mapped[dict[str, Any]] = mapped_column(JSON)


class CaveatRow(CourtColumns, Base):
    __tablename__ = "caveats"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    status: Mapped[str] = mapped_column(String(16), index=True)
    body: Mapped[dict[str, Any]] = mapped_column(JSON)


class ProcessRow(Base):
    __tablename__ = "processes"
    process_id: Mapped[str] = mapped_column(String(40), primary_key=True)
    # Fictional address on the reserved example.invalid domain. Never returned by the API and never logged.
    email: Mapped[str] = mapped_column(String(200))
    body: Mapped[dict[str, Any]] = mapped_column(JSON)


class LocationRow(CourtColumns, Base):
    __tablename__ = "locations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    body: Mapped[dict[str, Any]] = mapped_column(JSON)
