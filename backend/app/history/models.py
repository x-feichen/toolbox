"""Tool usage history model.

MVP records only: who used which tool, when. Tool inputs are never stored
(design doc §23, privacy principle §24).
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ToolHistoryEntry(Base):
    __tablename__ = "tool_history"
    __table_args__ = (Index("ix_history_user_executed", "user_id", "executed_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    tool_slug: Mapped[str] = mapped_column(
        String(100), ForeignKey("tools.slug", ondelete="CASCADE"), nullable=False
    )
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
