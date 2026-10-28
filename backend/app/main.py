from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers the tables)
from .config import settings
from .db import Base, SessionLocal, engine
from .routers.api import router
from .seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    if settings.seed_on_start:
        with SessionLocal() as session:
            seed(session)
    yield


app = FastAPI(
    title="myCourt API (prototype)",
    version="0.1.0",
    description="Serves fictional demonstration data only. Not connected to eCourts and not affiliated with the judiciary.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
)
app.include_router(router)
