"""Prompt routes — all endpoints require authentication."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_current_user
from app.auth.models import User
from app.core.database import get_db
from app.prompts import service as prompt_service
from app.prompts.schemas import PromptCreateIn, PromptOut, PromptUpdateIn

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("", response_model=list[PromptOut])
async def list_prompts(
    q: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=50),
    favorite: bool | None = Query(default=None),
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PromptOut]:
    prompts = await prompt_service.list_prompts(
        db,
        user_id=user.id,
        q=q,
        category=category,
        favorite_only=bool(favorite) if favorite is not None else False,
    )
    return [PromptOut.model_validate(p) for p in prompts]


@router.get("/categories", response_model=list[str])
async def list_categories(
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    return await prompt_service.list_categories(db, user_id=user.id)


@router.post("", response_model=PromptOut, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    data: PromptCreateIn,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> PromptOut:
    prompt = await prompt_service.create_prompt(
        db,
        user_id=user.id,
        title=data.title,
        content=data.content,
        description=data.description,
        category=data.category,
    )
    return PromptOut.model_validate(prompt)


@router.get("/{prompt_id}", response_model=PromptOut)
async def get_prompt(
    prompt_id: uuid.UUID,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> PromptOut:
    prompt = await prompt_service.get_prompt(db, user_id=user.id, prompt_id=prompt_id)
    return PromptOut.model_validate(prompt)


@router.patch("/{prompt_id}", response_model=PromptOut)
async def update_prompt(
    prompt_id: uuid.UUID,
    data: PromptUpdateIn,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> PromptOut:
    updates = data.model_dump(exclude_unset=True)
    prompt = await prompt_service.update_prompt(
        db, user_id=user.id, prompt_id=prompt_id, updates=updates
    )
    return PromptOut.model_validate(prompt)


@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: uuid.UUID,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await prompt_service.delete_prompt(db, user_id=user.id, prompt_id=prompt_id)
