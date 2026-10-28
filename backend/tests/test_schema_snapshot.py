"""A model change needs its own Alembic revision (each revision creates a fixed list of tables).

This test keeps that rule from being forgotten: it compares the live model definitions with a committed snapshot.
If it fails, add a migration under `migrations/versions/`, then refresh the snapshot with
`UPDATE_SCHEMA_SNAPSHOT=1 python -m pytest tests/test_schema_snapshot.py`.
"""
import json
import os
from pathlib import Path

from app import models  # noqa: F401  (registers every table)
from app.db import Base

SNAPSHOT = Path(__file__).with_name("schema_snapshot.json")


def current() -> dict:
    return {
        t.name: {c.name: f"{c.type.__class__.__name__}{'' if c.nullable else ' NOT NULL'}" for c in t.columns}
        for t in sorted(Base.metadata.tables.values(), key=lambda t: t.name)
    }


def test_models_match_the_committed_schema_snapshot():
    now = current()
    if os.environ.get("UPDATE_SCHEMA_SNAPSHOT"):
        SNAPSHOT.write_text(json.dumps(now, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    saved = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    assert now == saved, "Models changed: add an Alembic revision, then refresh tests/schema_snapshot.json (see this file's docstring)."


def test_every_model_table_is_created_by_some_migration():
    text = "\n".join(p.read_text(encoding="utf-8") for p in Path(__file__).parent.parent.glob("migrations/versions/*.py"))
    missing = [t for t in current() if f"'{t}'" not in text and f'"{t}"' not in text]
    assert not missing, f"Tables with no migration: {missing}"
