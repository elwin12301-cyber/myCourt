from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers the tables)
from .config import settings
from .core import errors, logging as safe_logging, ratelimit
from .core.real_data import enforce_real_data_gate
from .db import SessionLocal
from .migrate import upgrade
from .routers import audit, auth, contents, dashboard, drafts, intake, matters
from .routers.services_site import router as services_router
from .seed import seed

safe_logging.install()


@asynccontextmanager
async def lifespan(_: FastAPI):
    upgrade()
    enforce_real_data_gate()
    if settings.seed_on_start:
        with SessionLocal() as session:
            seed(session)
    yield


app = FastAPI(
    title="myCourt API (prototype)",
    version="0.2.0",
    description="Serves fictional demonstration data only. Not connected to eCourts and not affiliated with the judiciary.",
    lifespan=lifespan,
)
errors.install(app)


@app.middleware("http")
async def limit_requests(request: Request, call_next):
    client = request.client.host if request.client else "unknown"
    if not ratelimit.allow(client, request.url.path):
        return JSONResponse(status_code=429, content=errors.body("too_many_attempts", "Too many requests. Try again in a minute."))
    return await call_next(request)


app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Content-Type", "X-CSRF-Token"],
)
for r in (services_router, auth.router, matters.router, contents.router, drafts.router, intake.router, audit.router, dashboard.router):
    app.include_router(r)
