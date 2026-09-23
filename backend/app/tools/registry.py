"""Tool Registry: registration, lookup and database synchronisation.

Tools register themselves at import time; the platform never needs to be
modified when a tool is added (design doc §75).
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.tools.base import RegisteredTool, ToolManifest, ToolService
from app.tools.models import Tool


class ToolSlugTakenError(Exception):
    def __init__(self, slug: str) -> None:
        super().__init__(f"Tool slug already registered: {slug}")
        self.slug = slug


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, RegisteredTool] = {}

    def register(
        self, manifest: ToolManifest, service: ToolService | None = None
    ) -> RegisteredTool:
        if manifest.slug in self._tools:
            raise ToolSlugTakenError(manifest.slug)
        tool = RegisteredTool(manifest, service)
        self._tools[manifest.slug] = tool
        return tool

    def get(self, slug: str) -> RegisteredTool:
        try:
            return self._tools[slug]
        except KeyError:
            raise KeyError(slug) from None

    def exists(self, slug: str) -> bool:
        return slug in self._tools

    def list(self) -> list[RegisteredTool]:
        return list(self._tools.values())

    def __len__(self) -> int:
        return len(self._tools)

    async def sync_to_db(self, db: AsyncSession) -> None:
        """Upsert registry metadata into the tools table (code-first, DB-assisted)."""
        for tool in self._tools.values():
            m = tool.manifest
            existing = await db.get(Tool, m.slug)
            if existing is None:
                db.add(
                    Tool(
                        slug=m.slug,
                        name=m.name,
                        description=m.description,
                        category=m.category,
                        icon=m.icon,
                        version=m.version,
                        status=m.status,
                        requires_auth=tool.requires_auth,
                        execution_mode=m.execution,
                        ui_type=m.ui,
                    )
                )
            else:
                existing.name = m.name
                existing.description = m.description
                existing.category = m.category
                existing.icon = m.icon
                existing.version = m.version
                existing.status = m.status
                existing.requires_auth = tool.requires_auth
                existing.execution_mode = m.execution
                existing.ui_type = m.ui
        await db.commit()


registry = ToolRegistry()


def load_tools() -> None:
    """Import all tool packages; each registers itself into the registry."""
    from app.tools import json_formatter, prompt_manager  # noqa: F401
