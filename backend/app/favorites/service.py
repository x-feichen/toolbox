"""Favorite business logic (user-scoped)."""

from __future__ import annotations

import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, ErrorCode
from app.favorites.models import Favorite
from app.tools.models import Tool


class ToolNotFavoriteError(AppError):
    def __init__(self) -> None:
        super().__init__(ErrorCode.NOT_FOUND, "未收藏该工具", status_code=404)


async def list_favorites(db: AsyncSession, *, user_id: uuid.UUID) -> list[Favorite]:
    result = await db.execute(
        select(Favorite)
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.created_at.desc())
    )
    return list(result.scalars().all())


async def add_favorite(db: AsyncSession, *, user_id: uuid.UUID, tool_slug: str) -> Favorite:
    tool = await db.get(Tool, tool_slug)
    if tool is None:
        raise AppError(ErrorCode.TOOL_NOT_FOUND, "工具不存在", status_code=404)

    existing = await db.get(Favorite, (user_id, tool_slug))
    if existing is not None:
        return existing  # idempotent

    favorite = Favorite(user_id=user_id, tool_slug=tool_slug)
    db.add(favorite)
    await db.commit()
    await db.refresh(favorite)
    return favorite


async def remove_favorite(db: AsyncSession, *, user_id: uuid.UUID, tool_slug: str) -> None:
    result = await db.execute(
        delete(Favorite).where(Favorite.user_id == user_id, Favorite.tool_slug == tool_slug)
    )
    if (result.rowcount or 0) == 0:
        raise ToolNotFavoriteError()
    await db.commit()


async def is_favorite(db: AsyncSession, *, user_id: uuid.UUID, tool_slug: str) -> bool:
    return await db.get(Favorite, (user_id, tool_slug)) is not None
