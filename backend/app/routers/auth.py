from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..core import throttle
from ..core.audit import append_audit
from ..core.deps import Auth, check_origin, current_auth, is_operator
from ..core.errors import Forbidden, Invalid, NotFound
from ..core.security import DUMMY_HASH, hash_password, password_problem, verify_password
from ..core.sessions import COOKIE, create_session, revoke_all
from ..db import get_session
from ..models.accounts import Person
from ..schemas.workspace import LoginIn, PasswordIn, RegisterIn

router = APIRouter(prefix="/api")

GENERIC_FAILURE = "Sign-in failed. Check your e-mail address and password."


def _person_out(p: Person) -> dict:
    return {"id": p.id, "email": p.email, "displayName": p.display_name, "isOperator": is_operator(p)}


def _client(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/auth/register", status_code=202)
def register(req: RegisterIn, request: Request, db: Session = Depends(get_session)) -> dict:
    """Same answer whether or not the address is already used, so it cannot be probed."""
    check_origin(request)
    problem = password_problem(req.password)
    if problem:
        raise Invalid(fields={"password": problem})
    hashed = hash_password(req.password)  # always hashed, so timing is the same either way
    if db.scalars(select(Person).where(Person.email == req.email)).first() is None:
        db.add(Person(email=req.email, display_name=req.display_name.strip(), password_hash=hashed))
        db.commit()
    return {"status": "accepted"}


@router.post("/auth/login")
def login(req: LoginIn, request: Request, response: Response, db: Session = Depends(get_session)) -> dict:
    check_origin(request)
    email = req.email.strip().lower()
    client = _client(request)
    throttle.check(db, email, client)
    person = db.scalars(select(Person).where(Person.email == email)).first()
    stored = person.password_hash if person else DUMMY_HASH
    ok = verify_password(req.password, stored) and person is not None and person.active
    throttle.record(db, email, client, ok)
    if not ok:
        db.commit()
        from ..core.errors import NotSignedIn
        raise NotSignedIn(GENERIC_FAILURE)
    token, row = create_session(db, person)
    append_audit(db, person.id, None, "sign_in", "person", person.id)
    db.commit()
    response.set_cookie(COOKIE, token, httponly=True, samesite="lax", secure=settings.cookie_secure,
                        max_age=settings.session_max_hours * 3600, path="/")
    return {"person": _person_out(person), "csrfToken": row.csrf_token}


@router.post("/auth/logout")
def logout(response: Response, auth: Auth = Depends(current_auth), db: Session = Depends(get_session)) -> dict:
    db.delete(auth.session)
    append_audit(db, auth.person.id, None, "sign_out", "person", auth.person.id)
    db.commit()
    response.delete_cookie(COOKIE, path="/")
    return {"status": "signed_out"}


@router.get("/auth/me")
def me(auth: Auth = Depends(current_auth)) -> dict:
    return {"person": _person_out(auth.person), "csrfToken": auth.session.csrf_token}


@router.post("/auth/password")
def change_password(req: PasswordIn, auth: Auth = Depends(current_auth), db: Session = Depends(get_session)) -> dict:
    if not verify_password(req.current_password, auth.person.password_hash):
        raise Invalid(fields={"currentPassword": "That is not your current password."})
    problem = password_problem(req.new_password)
    if problem:
        raise Invalid(fields={"newPassword": problem})
    auth.person.password_hash = hash_password(req.new_password)
    revoke_all(db, auth.person.id, except_id=auth.session.id)
    db.commit()
    return {"status": "changed"}


@router.post("/admin/people/{person_id}/deactivate")
def deactivate(person_id: str, auth: Auth = Depends(current_auth), db: Session = Depends(get_session)) -> dict:
    if not is_operator(auth.person):
        raise Forbidden()
    target = db.get(Person, person_id)
    if target is None:
        raise NotFound()
    target.active = False
    revoke_all(db, target.id)
    db.commit()
    return {"status": "deactivated"}
