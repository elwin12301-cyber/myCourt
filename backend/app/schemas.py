"""Request bodies. Field names are camelCase on the wire, matching the front end. The server validates everything
again; the front end's checks are a convenience, never the control (constitution Principle V)."""
import re
from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

CNR = re.compile(r"^[A-Z0-9]{16}$")
BAR_CODE = re.compile(r"^[A-Z]{1,4}/\d{1,6}/\d{4}$")
DIGITS = re.compile(r"^\d{1,7}$")
MIN_NAME = 3

Status = Literal["Pending", "Disposed"]
StatusFilter = Literal["Pending", "Disposed", "Both"]
OrderFilter = Literal["Interim", "Final", "Both"]
Nonblank = Annotated[str, Field(min_length=1, max_length=120)]


class Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid", str_strip_whitespace=True)


def year_ok(y: str) -> str:
    if not re.fullmatch(r"\d{4}", y) or not 1950 <= int(y) <= date.today().year:
        raise ValueError(f"Enter a 4-digit year between 1950 and {date.today().year}.")
    return y


def iso_date(s: str) -> str:
    try:
        date.fromisoformat(s)
    except ValueError as e:
        raise ValueError("Enter a valid date (YYYY-MM-DD).") from e
    return s


def number_ok(n: str) -> str:
    if not DIGITS.match(n):
        raise ValueError("Enter a number of 1 to 7 digits.")
    return n


def name_ok(n: str) -> str:
    if len(n.strip()) < MIN_NAME:
        raise ValueError(f"Enter at least {MIN_NAME} characters of the name.")
    return n


class Court(Camel):
    state: Nonblank
    district: Nonblank
    complex: Nonblank
    establishment: str = Field(default="", max_length=120)


# ---------- Case Status ----------
class CnrQuery(Camel):
    mode: Literal["cnr"]
    cnr: str

    @field_validator("cnr")
    @classmethod
    def _cnr(cls, v: str) -> str:
        v = v.upper()
        if not CNR.match(v):
            raise ValueError("CNR must be 16 letters or digits, with no spaces or hyphens.")
        return v


class PartyQuery(Camel):
    mode: Literal["party"]
    court: Court
    name: str
    year: str
    status: StatusFilter
    v_n = field_validator("name")(lambda cls, v: name_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


class CaseNumberQuery(Camel):
    mode: Literal["caseNumber"]
    court: Court
    case_type: Nonblank
    number: str
    year: str
    v_num = field_validator("number")(lambda cls, v: number_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


class FilingNumberQuery(Camel):
    mode: Literal["filingNumber"]
    court: Court
    case_type: Nonblank
    number: str
    year: str
    v_num = field_validator("number")(lambda cls, v: number_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


class AdvocateQuery(Camel):
    mode: Literal["advocate"]
    court: Court
    by: Literal["name", "barCode", "caseListDate"]
    name: str = ""
    bar_code: str = ""
    date: str = ""
    status: StatusFilter = "Both"

    @model_validator(mode="after")
    def _check(self):
        if self.by == "barCode":
            self.bar_code = self.bar_code.upper()
            if not BAR_CODE.match(self.bar_code):
                raise ValueError("Enter the bar code in the form STATE/NUMBER/YEAR, for example MAH/1234/1982.")
        else:
            name_ok(self.name)
            if self.by == "caseListDate":
                iso_date(self.date)
        return self


class FirQuery(Camel):
    mode: Literal["fir"]
    court: Court
    police_station: Nonblank
    number: str = ""
    year: str = ""
    status: StatusFilter

    @model_validator(mode="after")
    def _check(self):
        if self.number and not DIGITS.match(self.number):
            raise ValueError("FIR number must be digits only.")
        if self.year:
            year_ok(self.year)
        return self


class ActQuery(Camel):
    mode: Literal["act"]
    court: Court
    act_type: Nonblank
    section: str = Field(default="", max_length=60)
    status: Status


class CaseTypeQuery(Camel):
    mode: Literal["caseType"]
    court: Court
    case_type: Nonblank
    year: str
    status: Status
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


CaseQuery = Annotated[
    CnrQuery | PartyQuery | CaseNumberQuery | FilingNumberQuery | AdvocateQuery | FirQuery | ActQuery | CaseTypeQuery,
    Field(discriminator="mode"),
]


# ---------- Court Orders ----------
class OrderParty(Camel):
    mode: Literal["party"]
    court: Court
    name: str
    year: str
    filter: OrderFilter
    v_n = field_validator("name")(lambda cls, v: name_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


class OrderCaseNumber(Camel):
    mode: Literal["caseNumber"]
    court: Court
    case_type: Nonblank
    number: str
    year: str
    filter: OrderFilter
    v_num = field_validator("number")(lambda cls, v: number_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


class OrderCourtNumber(Camel):
    mode: Literal["courtNumber"]
    court: Court
    room_id: Nonblank
    filter: OrderFilter


class OrderDate(Camel):
    mode: Literal["orderDate"]
    court: Court
    from_: str = Field(alias="from")
    to: str
    filter: OrderFilter
    model_config = ConfigDict(populate_by_name=True, extra="forbid", str_strip_whitespace=True)

    @model_validator(mode="after")
    def _check(self):
        iso_date(self.from_)
        iso_date(self.to)
        if self.from_ > self.to:
            raise ValueError("The to date must not be earlier than the from date.")
        return self


OrderQuery = Annotated[OrderParty | OrderCaseNumber | OrderCourtNumber | OrderDate, Field(discriminator="mode")]


class OrderSearch(BaseModel):
    query: OrderQuery


class CaseSearch(BaseModel):
    query: CaseQuery


# ---------- Cause list ----------
class CauseListQuery(Camel):
    room_id: Nonblank
    date: str
    kind: Literal["Civil", "Criminal"]
    v_d = field_validator("date")(lambda cls, v: iso_date(v))


# ---------- Caveat Search ----------
class CaveatName(Camel):
    mode: Literal["name"]
    court: Court
    role: Literal["caveator", "caveatee"]
    match: Literal["anywhere", "startingWith"]
    name: str
    v_n = field_validator("name")(lambda cls, v: name_ok(v))


class CaveatCaseNumber(Camel):
    mode: Literal["caseNumber"]
    court: Court
    subordinate_court: str = ""
    case_type: Nonblank
    number: str
    year: str
    decision_date: str = ""
    v_num = field_validator("number")(lambda cls, v: number_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))

    @field_validator("decision_date")
    @classmethod
    def _dd(cls, v: str) -> str:
        return iso_date(v) if v else v


class CaveatFilingNumber(Camel):
    mode: Literal["filingNumber"]
    court: Court
    subordinate_court: str = ""
    case_type: Nonblank
    number: str
    year: str
    v_num = field_validator("number")(lambda cls, v: number_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


class CaveatNumber(Camel):
    mode: Literal["caveatNumber"]
    court: Court
    caveat_number: str
    year: str
    v_num = field_validator("caveat_number")(lambda cls, v: number_ok(v))
    v_y = field_validator("year")(lambda cls, v: year_ok(v))


CaveatQuery = Annotated[CaveatName | CaveatCaseNumber | CaveatFilingNumber | CaveatNumber, Field(discriminator="mode")]


class CaveatSearch(BaseModel):
    query: CaveatQuery


# ---------- Process Details ----------
class ProcessLookup(Camel):
    process_id: str
    email: str

    @field_validator("process_id")
    @classmethod
    def _id(cls, v: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9\-/]{3,29}", v):
            raise ValueError("The process ID may contain only letters, digits, hyphens and slashes (4 to 30 characters).")
        return v

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", v):
            raise ValueError("Enter a valid e-mail address.")
        return v


# ---------- Location ----------
class LocationLookup(Camel):
    court: Court
