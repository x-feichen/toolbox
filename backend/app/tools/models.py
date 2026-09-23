"""Tool persistence model (registry sync target)."""

from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin


class Tool(TimestampMixin, Base):
    __tablename__ = "tools"

    # Tools are code-first; slug is the natural primary key in the DB mirror.
    slug: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="other", nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0.0", nullable=False)
    # draft | beta | stable | deprecated
    status: Mapped[str] = mapped_column(String(20), default="stable", nullable=False)
    requires_auth: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # client | server | hybrid
    execution_mode: Mapped[str] = mapped_column(String(20), default="client", nullable=False)
    # form | editor | upload | viewer | custom
    ui_type: Mapped[str] = mapped_column(String(20), default="form", nullable=False)
