"""Runs Alembic programmatically so start-up and the CLI apply the same ordered, repeatable steps (FR-021)."""
from pathlib import Path

from alembic import command
from alembic.config import Config

from .config import settings

ROOT = Path(__file__).resolve().parent.parent


def alembic_config(url: str | None = None) -> Config:
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "migrations"))
    cfg.set_main_option("sqlalchemy.url", (url or settings.database_url).replace("%", "%%"))
    return cfg


def upgrade(url: str | None = None, revision: str = "head") -> None:
    command.upgrade(alembic_config(url), revision)
