from dataclasses import dataclass

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_session
from ..models.accounts import Person, SessionRow
from .errors import Forbidden, NotSignedIn
from .sessions import COOKIE, load_session

SAFE = {"GET", "HEAD", "OPTIONS"}


@dataclass
class Auth:
    person: Person
    session: SessionRow


def check_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin and origin not in settings.cors_origins:
        raise Forbidden("Request not allowed from this origin.")


def current_auth(request: Request, db: Session = Depends(get_session)) -> Auth:
    """The signed-in person. Changing requests also need the CSRF token returned at sign-in and an allowed Origin."""
    found = load_session(db, request.cookies.get(COOKIE))
    if found is None:
        raise NotSignedIn()
    row, person = found
    if request.method not in SAFE:
        check_origin(request)
        if request.headers.get("x-csrf-token") != row.csrf_token:
            raise Forbidden("Missing or wrong security token.")
    return Auth(person=person, session=row)


def current_person(auth: Auth = Depends(current_auth)) -> Person:
    return auth.person


def is_operator(person: Person) -> bool:
    return person.email in {e.lower() for e in settings.operator_emails}
