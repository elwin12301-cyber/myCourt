"""audit

Each revision creates a FIXED list of tables, so later model changes need their own explicit revision
(the lists below are the contract of this revision). `checkfirst` makes it safe on a database that was
created before Alembic was introduced.
"""
from alembic import op

revision = "0002"
down_revision = '0001'
branch_labels = None
depends_on = None

TABLES = ['audit_entry']


def _tables():
    from app import models  # noqa: F401
    from app.db import Base
    return [Base.metadata.tables[t] for t in TABLES]


def upgrade() -> None:
    bind = op.get_bind()
    for t in _tables():
        t.create(bind, checkfirst=True)
    from app.models.audit import install_triggers
    install_triggers(bind)


def downgrade() -> None:
    bind = op.get_bind()
    for t in reversed(_tables()):
        t.drop(bind, checkfirst=True)
