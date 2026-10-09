"""Admin routes — user management (admin role only)."""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import service as admin_service
from app.admin.schemas import (
    AdminUserListOut,
    AdminUserOut,
    AdminUserUpdateIn,
)
from app.auth import service as auth_service
from app.auth.dependencies import require_admin
from app.auth.models import User
from app.auth.schemas import AdminResetPasswordIn
from app.core.database import get_db

logger = logging.getLogger("app.admin")

router = APIRouter(prefix="/admin/users", tags=["admin"])


@router.get("", response_model=AdminUserListOut)
async def list_users(
    q: str | None = Query(default=None, max_length=100),
    role: str | None = Query(default=None, pattern="^(user|admin)$"),
    status_filter: str | None = Query(default=None, alias="status", pattern="^(active|disabled)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserListOut:
    items, total = await admin_service.list_users(
        db, q=q, role=role, status=status_filter, page=page, page_size=page_size
    )
    return AdminUserListOut(
        items=[AdminUserOut.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{user_id}", response_model=AdminUserOut)
async def get_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserOut:
    user = await admin_service.get_user(db, user_id)
    return AdminUserOut.model_validate(user)


@router.patch("/{user_id}", response_model=AdminUserOut)
async def update_user(
    user_id: uuid.UUID,
    data: AdminUserUpdateIn,
    actor: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminUserOut:
    user = await admin_service.update_user(
        db,
        actor=actor,
        target_id=user_id,
        role=data.role,
        status=data.status,
    )
    return AdminUserOut.model_validate(user)


@router.post("/{user_id}/password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(
    user_id: uuid.UUID,
    data: AdminResetPasswordIn,
    actor: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> None:
    target = await admin_service.get_user(db, user_id)
    await auth_service.admin_reset_password(db, target, new_password=data.new_password)
    logger.info("admin.password_reset actor=%s target=%s", actor.id, target.id)
