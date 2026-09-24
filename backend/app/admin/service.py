"""Admin user-management business logic.

Guardrails (prevent admin lock-out):
  1. An admin cannot disable or demote themselves.
  2. The last remaining active admin cannot be demoted or disabled.

Every sensitive action is recorded through the structured logger; a durable
audit table is intentionally out of scope for the MVP.
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.core.errors import AppError, ErrorCode

logger = logging.getLogger("app.admin")


class UserNotFoundError(AppError):
    def __init__(self) -> None:
        super().__init__(ErrorCode.NOT_FOUND, "用户不存在", status_code=404)


class SelfMutationError(AppError):
    def __init__(self, message: str = "不能对自己执行该操作") -> None:
        super().__init__(ErrorCode.VALIDATION_ERROR, message, status_code=400)


class LastAdminError(AppError):
    def __init__(self) -> None:
        super().__init__(
            ErrorCode.VALIDATION_ERROR, "不能降级或禁用最后一个管理员", status_code=400
        )


async def list_users(
    db: AsyncSession,
    *,
    q: str | None = None,
    role: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[User], int]:
    filters = []
    if q:
        pattern = f"%{q}%"
        filters.append(or_(User.email.ilike(pattern), User.display_name.ilike(pattern)))
    if role:
        filters.append(User.role == role)
    if status:
        filters.append(User.status == status)

    total_result = await db.execute(select(func.count()).select_from(User).where(*filters))
    total = int(total_result.scalar_one())

    result = await db.execute(
        select(User)
        .where(*filters)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise UserNotFoundError()
    return user


async def count_active_admins(db: AsyncSession, *, excluding: uuid.UUID | None = None) -> int:
    stmt = select(func.count()).select_from(User).where(
        User.role == "admin", User.status == "active"
    )
    if excluding is not None:
        stmt = stmt.where(User.id != excluding)
    result = await db.execute(stmt)
    return int(result.scalar_one())


async def update_user(
    db: AsyncSession,
    *,
    actor: User,
    target_id: uuid.UUID,
    role: str | None,
    status: str | None,
) -> User:
    target = await get_user(db, target_id)
    is_self = target.id == actor.id
    demoting = role is not None and role != target.role
    disabling = status is not None and status != target.status

    if is_self and (demoting or disabling):
        raise SelfMutationError("不能修改自己的角色或状态")

    # Last active admin protection (only when the target is currently one).
    if (demoting or disabling) and target.role == "admin" and target.is_active:
        if await count_active_admins(db, excluding=target.id) == 0:
            raise LastAdminError()

    if role is not None:
        target.role = role
    if status is not None:
        target.status = status
    await db.commit()
    await db.refresh(target)

    logger.info(
        "admin.user_updated actor=%s target=%s role=%s status=%s",
        actor.id, target.id, target.role, target.status,
    )
    return target
