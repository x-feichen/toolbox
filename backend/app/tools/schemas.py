"""Tool API schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.tools.base import AccessType, ExecutionMode, ToolCategory, ToolManifest, UIType


class ToolOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    name: str
    description: str
    category: ToolCategory
    tags: list[str]
    icon: str | None
    version: str
    status: str
    access: AccessType
    execution: ExecutionMode
    ui: UIType
    requires_auth: bool

    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_manifest(cls, manifest: ToolManifest, requires_auth: bool, created_at: datetime, updated_at: datetime) -> ToolOut:
        return cls(
            slug=manifest.slug,
            name=manifest.name,
            description=manifest.description,
            category=manifest.category,
            tags=manifest.tags,
            icon=manifest.icon,
            version=manifest.version,
            status=manifest.status,
            access=manifest.access,
            execution=manifest.execution,
            ui=manifest.ui,
            requires_auth=requires_auth,
            created_at=created_at,
            updated_at=updated_at,
        )


class ToolExecuteIn(BaseModel):
    action: str = Field(min_length=1, max_length=50)
    payload: dict[str, Any] = Field(default_factory=dict)


class ToolExecuteOut(BaseModel):
    result: dict[str, Any]
