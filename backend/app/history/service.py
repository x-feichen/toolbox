"""Tool usage history business logic (user-scoped)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, ErrorCode
from app.history.models import ToolHistoryEntry
from app.tools.models import Tool


async def record_usage(db: AsyncSession, *, user_id: uuid.UUID, tool_slug: str) -> None:
    tool = await db.get(Tool, tool_slug)
    if tool is None:
        raise AppError(ErrorCode.TOOL_NOT_FOUND, "工具不存在", status_code=404)
    db.add(ToolHistoryEntry(user_id=user_id, tool_slug=tool_slug))
    await db.commit()


async def list_history(
    db: AsyncSession, *, user_id: uuid.UUID, limit: int = 20
) -> list[ToolHistoryEntry]:
    result = await db.execute(
        select(ToolHistoryEntry)
        .where(ToolHistoryEntry.user_id == user_id)
        .order_by(ToolHistoryEntry.executed_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def recent_tool_slugs(
    db: AsyncSession, *, user_id: uuid.UUID, limit: int = 8
) -> list[str]:
    """Distinct recently used tool slugs, most recent first, deduplicated."""
    entries = await list_history(db, user_id=user_id, limit=200)
    seen: set[str] = set()
    ordered: list[str] = []
    for entry in entries:
        if entry.tool_slug not in seen:
            seen.add(entry.tool_slug)
            ordered.append(entry.tool_slug)
        if len(ordered) >= limit:
            break
    return ordered


async def clear_history(db: AsyncSession, *, user_id: uuid.UUID) -> int:
    result = await db.execute(
        delete(ToolHistoryEntry).where(ToolHistoryEntry.user_id == user_id)
    )
    await db.commit()
    return result.rowcount or 0


def now_utc() -> datetime:
    return datetime.now(timezone.utc)
