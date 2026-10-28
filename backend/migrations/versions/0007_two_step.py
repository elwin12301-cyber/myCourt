"""two-step sign-in columns on persons

Adds the optional authenticator-app secret and flag. Written with an inspector so it is safe on a database whose
`persons` table was created from the newest models (which already have the columns).
"""
import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def _columns() -> set[str]:
    return {c["name"] for c in sa.inspect(op.get_bind()).get_columns("persons")}


def upgrade() -> None:
    have = _columns()
    if "totp_secret" not in have:
        op.add_column("persons", sa.Column("totp_secret", sa.String(64), nullable=True))
    if "totp_enabled" not in have:
        op.add_column("persons", sa.Column("totp_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    have = _columns()
    if "totp_enabled" in have:
        op.drop_column("persons", "totp_enabled")
    if "totp_secret" in have:
        op.drop_column("persons", "totp_secret")
