"""One error body for every failure: {"code", "message", "fields"}. Submitted values are never echoed."""
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm.exc import StaleDataError
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppError(Exception):
    status = 400
    code = "bad_request"

    def __init__(self, message: str = "The request could not be processed.", fields: dict[str, str] | None = None):
        super().__init__(message)
        self.message = message
        self.fields = fields or {}


class NotSignedIn(AppError):
    status, code = 401, "not_signed_in"

    def __init__(self, message: str = "Sign in to continue."):
        super().__init__(message)


class MfaRequired(AppError):
    """Only raised after the password was right, so it reveals nothing an attacker could not already prove."""
    status, code = 401, "mfa_required"

    def __init__(self):
        super().__init__("Enter the 6-digit code from your authenticator app.")


class Forbidden(AppError):
    status, code = 403, "forbidden"

    def __init__(self, message: str = "You do not have permission to do that."):
        super().__init__(message)


class NotFound(AppError):
    """Used for unknown items AND for items the caller may not see. The body must be identical."""
    status, code = 404, "not_found"

    def __init__(self):
        super().__init__("Not found.")


class Conflict(AppError):
    status, code = 409, "conflict"

    def __init__(self, message: str = "The item changed since you opened it.", current_version: int | None = None):
        super().__init__(message)
        self.current_version = current_version


class TooLarge(AppError):
    status, code = 413, "too_large"

    def __init__(self, message: str = "That text is too long."):
        super().__init__(message)


class Invalid(AppError):
    status, code = 422, "validation_failed"

    def __init__(self, message: str = "Check the highlighted fields.", fields: dict[str, str] | None = None):
        super().__init__(message, fields)


class TooMany(AppError):
    status, code = 429, "too_many_attempts"

    def __init__(self):
        super().__init__("Too many attempts. Try again later.")


class Unavailable(AppError):
    status, code = 503, "unavailable"

    def __init__(self, message: str = "The service is unavailable. Try again."):
        super().__init__(message)


def body(code: str, message: str, fields: dict[str, str] | None = None, **extra) -> dict:
    return {"code": code, "message": message, "fields": fields or {}, **extra}


_CODES = {400: "bad_request", 401: "not_signed_in", 403: "forbidden", 404: "not_found", 405: "method_not_allowed",
          409: "conflict", 413: "too_large", 422: "validation_failed", 429: "too_many_attempts", 503: "unavailable"}


def install(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError):
        extra = {"currentVersion": exc.current_version} if isinstance(exc, Conflict) and exc.current_version is not None else {}
        return JSONResponse(body(exc.code, exc.message, exc.fields, **extra), status_code=exc.status)

    @app.exception_handler(StaleDataError)
    async def _stale(_: Request, exc: StaleDataError):
        # Someone else saved first (the database version check failed). Nothing was written.
        return JSONResponse(body("conflict", "The item changed since you opened it."), status_code=409)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        fields: dict[str, str] = {}
        for err in exc.errors():
            loc = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
            msg = str(err.get("msg", "Invalid value.")).removeprefix("Value error, ")
            fields[".".join(loc) or "request"] = msg  # never err["input"]
        return JSONResponse(body("validation_failed", "Check the highlighted fields.", fields), status_code=422)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        return JSONResponse(body(_CODES.get(exc.status_code, "error"), "Not found." if exc.status_code == 404 else str(exc.detail)),
                            status_code=exc.status_code)
