"""User profile routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_current_user
from app.auth.models import User
from app.auth.schemas import UpdateProfileIn, UserOut
from app.auth import service as auth_service
from app.core.database import get_db

router = APIRouter(tags=["users"])


@router.get("/me", response_model=UserOut, tags=["users"])
async def get_me(user: User = Depends(require_current_user)) -> UserOut:
    return UserOut.model_validate(user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UpdateProfileIn,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    updated = await auth_service.update_user_profile(
        db, user, display_name=data.display_name, avatar_url=data.avatar_url
    )
    return UserOut.model_validate(updated)
