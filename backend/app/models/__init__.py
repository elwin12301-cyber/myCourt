"""Importing this package registers every table with SQLAlchemy's metadata."""
from . import accounts, audit, services, workspace  # noqa: F401
