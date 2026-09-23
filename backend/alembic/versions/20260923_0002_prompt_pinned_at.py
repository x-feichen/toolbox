"""prompt favorite → pinned_at

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-23
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("prompts", sa.Column("pinned_at", sa.DateTime(timezone=True), nullable=True))
    # Carry existing favorites over as pinned entries.
    op.execute("UPDATE prompts SET pinned_at = now() WHERE is_favorite = true")
    op.drop_column("prompts", "is_favorite")


def downgrade() -> None:
    op.add_column(
        "prompts",
        sa.Column("is_favorite", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute("UPDATE prompts SET is_favorite = true WHERE pinned_at IS NOT NULL")
    op.drop_column("prompts", "pinned_at")
