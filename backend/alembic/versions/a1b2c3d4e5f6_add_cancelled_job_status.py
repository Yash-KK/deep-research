"""add cancelled job status

Revision ID: a1b2c3d4e5f6
Revises: 5581a4489504
Create Date: 2026-06-21 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "5581a4489504"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE jobstatus ADD VALUE IF NOT EXISTS 'CANCELLED'")


def downgrade() -> None:
    pass
