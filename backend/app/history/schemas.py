"""History schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class HistoryCreateIn(BaseModel):
    tool_slug: str


class HistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tool_slug: str
    executed_at: datetime
