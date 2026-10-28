import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.core import clock, ratelimit
from app.db import Base, get_session
from app.main import app
from app.seed import seed

from .helpers import Actor, make_actor

ORIGIN = "http://localhost:5173"


@pytest.fixture()
def sm():
    """In-memory SQLite copy of the schema (audit triggers included), so the tests need no Docker or PostgreSQL."""
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    maker = sessionmaker(bind=engine, expire_on_commit=False)
    with maker() as s:
        seed(s)
    maker.engine = engine
    return maker


@pytest.fixture()
def client(sm):
    def override():
        with sm() as s:
            yield s

    app.dependency_overrides[get_session] = override
    clock.reset()
    ratelimit.reset()
    yield TestClient(app)
    app.dependency_overrides.clear()
    clock.reset()


@pytest.fixture()
def alice(client, sm) -> Actor:
    return make_actor(client, sm, "alice@example.invalid", "Alice Advocate")


@pytest.fixture()
def bob(client, sm) -> Actor:
    return make_actor(client, sm, "bob@example.invalid", "Bob Advocate")
