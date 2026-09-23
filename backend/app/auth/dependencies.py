"""Auth FastAPI dependencies: cookie -> session -> current user.

Frontend permission checks are UX only; every protected API re-verifies the
session here (design doc §16, principle 6).
"""

from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth import service as auth_service
from app.core.database import get_db
from app.core.errors import AppError, ErrorCode
from app.core.config import get_settings


def get_session_token(request: Request) -> str | None:
    return request.cookies.get(get_settings().session_cookie_name)


async def get_current_user(
    token: str | None = Depends(get_session_token),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not token:
        return None
    return await auth_service.get_user_by_session_token(db, token)


async def require_current_user(
    user: User | None = Depends(get_current_user),
) -> User:
    if user is None:
        raise AppError(
            ErrorCode.AUTH_REQUIRED, "请登录后使用该功能", status_code=401
        )
    return user
