"""Favorite routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_current_user
from app.auth.models import User
from app.core.database import get_db
from app.favorites import service as favorite_service
from app.favorites.schemas import FavoriteCreateIn, FavoriteOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteOut])
async def list_favorites(
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[FavoriteOut]:
    favorites = await favorite_service.list_favorites(db, user_id=user.id)
    return [FavoriteOut.model_validate(f) for f in favorites]


@router.post("", response_model=FavoriteOut, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    data: FavoriteCreateIn,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> FavoriteOut:
    favorite = await favorite_service.add_favorite(db, user_id=user.id, tool_slug=data.tool_slug)
    return FavoriteOut.model_validate(favorite)


@router.delete("/{tool_slug}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    tool_slug: str,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await favorite_service.remove_favorite(db, user_id=user.id, tool_slug=tool_slug)
