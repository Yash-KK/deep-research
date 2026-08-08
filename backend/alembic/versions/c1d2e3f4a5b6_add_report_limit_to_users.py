"""add report_limit to users

Revision ID: c1d2e3f4a5b6
Revises: b0243a05f22d
Create Date: 2026-08-08 12:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b0243a05f22d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("report_limit", sa.Integer(), nullable=False, server_default="2"),
    )


def downgrade() -> None:
    op.drop_column("users", "report_limit")
