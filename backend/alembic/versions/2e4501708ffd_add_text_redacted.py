"""add text_redacted

Revision ID: 2e4501708ffd
Revises: 5be2c3ab27d6
Create Date: 2026-02-10 16:19:52.205961

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "2e4501708ffd"
down_revision: str | Sequence[str] | None = "5be2c3ab27d6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("consultation_runs", sa.Column("text_redacted", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("consultation_runs", "text_redacted")
