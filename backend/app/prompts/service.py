"""Prompt business logic.

Security invariant: every query is scoped by user_id. A user can never read,
modify or even confirm the existence of another user's prompt — ownership
violations surface as NOT_FOUND, never FORBIDDEN (no existence leak).
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, ErrorCode
from app.prompts.models import Prompt


class PromptNotFoundError(AppError):
    def __init__(self) -> None:
        super().__init__(ErrorCode.NOT_FOUND, "Prompt 不存在", status_code=404)


async def list_prompts(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    q: str | None = None,
    category: str | None = None,
    favorite_only: bool = False,
) -> list[Prompt]:
    stmt = select(Prompt).where(Prompt.user_id == user_id)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(Prompt.title.ilike(pattern) | Prompt.content.ilike(pattern))
    if category:
        stmt = stmt.where(Prompt.category == category)
    if favorite_only:
        stmt = stmt.where(Prompt.is_favorite.is_(True))
    stmt = stmt.order_by(Prompt.updated_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def count_prompts(db: AsyncSession, *, user_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count()).select_from(Prompt).where(Prompt.user_id == user_id)
    )
    return int(result.scalar_one())


async def get_prompt(db: AsyncSession, *, user_id: uuid.UUID, prompt_id: uuid.UUID) -> Prompt:
    # WHERE id = :prompt_id AND user_id = :current_user_id (design doc §20)
    result = await db.execute(
        select(Prompt).where(Prompt.id == prompt_id, Prompt.user_id == user_id)
    )
    prompt = result.scalar_one_or_none()
    if prompt is None:
        raise PromptNotFoundError()
    return prompt


async def create_prompt(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    title: str,
    content: str = "",
    description: str = "",
    category: str = "",
) -> Prompt:
    prompt = Prompt(
        user_id=user_id,
        title=title,
        content=content,
        description=description,
        category=category,
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return prompt


async def update_prompt(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    prompt_id: uuid.UUID,
    updates: dict,
) -> Prompt:
    prompt = await get_prompt(db, user_id=user_id, prompt_id=prompt_id)
    for field, value in updates.items():
        setattr(prompt, field, value)
    await db.commit()
    await db.refresh(prompt)
    return prompt


async def delete_prompt(db: AsyncSession, *, user_id: uuid.UUID, prompt_id: uuid.UUID) -> None:
    prompt = await get_prompt(db, user_id=user_id, prompt_id=prompt_id)
    await db.delete(prompt)
    await db.commit()


async def list_categories(db: AsyncSession, *, user_id: uuid.UUID) -> list[str]:
    result = await db.execute(
        select(Prompt.category)
        .where(Prompt.user_id == user_id, Prompt.category != "")
        .distinct()
        .order_by(Prompt.category)
    )
    return [row[0] for row in result.all()]
