"""Favorite schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FavoriteCreateIn(BaseModel):
    tool_slug: str


class FavoriteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tool_slug: str
    created_at: datetime
