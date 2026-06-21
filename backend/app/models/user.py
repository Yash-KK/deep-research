import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    email = Column(String(255), unique=True, index=True, nullable=False)

    hashed_password = Column(String(255), nullable=True)

    full_name = Column(String(255), nullable=True)

    provider = Column(String(50), nullable=False, default="local")

    provider_user_id = Column(String(255), nullable=True)

    avatar_url = Column(String(500), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    jobs = relationship(
        "ResearchJob",
        back_populates="user",
        cascade="all, delete-orphan",
    )