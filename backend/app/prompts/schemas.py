"""Prompt API schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PromptCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(default="", max_length=100_000)
    description: str = Field(default="", max_length=2_000)
    category: str = Field(default="", max_length=50)


class PromptUpdateIn(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = Field(default=None, max_length=100_000)
    description: str | None = Field(default=None, max_length=2_000)
    category: str | None = Field(default=None, max_length=50)
    is_pinned: bool | None = None


class PromptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    description: str
    category: str
    is_pinned: bool
    pinned_at: datetime | None
    created_at: datetime
    updated_at: datetime
