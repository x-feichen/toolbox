"""Auth business logic: registration, credential check, session lifecycle."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import AuthSession, User
from app.core.config import get_settings
from app.core.errors import AppError, ErrorCode
from app.core.security import generate_session_token, hash_password, hash_session_token, verify_password


class EmailAlreadyExistsError(AppError):
    def __init__(self) -> None:
        super().__init__(
            ErrorCode.CONFLICT, "该邮箱已被注册", status_code=409
        )


class InvalidCredentialsError(AppError):
    def __init__(self) -> None:
        super().__init__(
            ErrorCode.INVALID_CREDENTIALS,
            "邮箱或密码不正确",
            status_code=401,
        )


class UserDisabledError(AppError):
    def __init__(self) -> None:
        super().__init__(ErrorCode.FORBIDDEN, "账号已被禁用", status_code=403)


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def register_user(
    db: AsyncSession, *, email: str, password: str, display_name: str | None = None
) -> User:
    if await get_user_by_email(db, email) is not None:
        raise EmailAlreadyExistsError()

    # Admin role is granted via the ADMIN_EMAILS allowlist (design doc §4.1).
    role = "admin" if get_settings().is_admin_email(email) else "user"

    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
        role=role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, *, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    # Run verify unconditionally to keep timing roughly constant even when the
    # user does not exist.
    stored = user.password_hash if user else hash_password("timing-equalizer")
    if user is None or not verify_password(password, stored):
        raise InvalidCredentialsError()
    if not user.is_active:
        raise UserDisabledError()

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    return user


async def create_user_session(db: AsyncSession, user: User) -> str:
    """Create a server-side session row and return the raw token (cookie value)."""
    settings = get_settings()
    token = generate_session_token()
    now = datetime.now(timezone.utc)
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(token),
        expires_at=now + timedelta(days=settings.session_lifetime_days),
        created_at=now,
        last_seen_at=now,
    )
    db.add(session)
    await db.commit()
    return token


async def get_user_by_session_token(db: AsyncSession, token: str) -> User | None:
    result = await db.execute(
        select(User)
        .join(AuthSession, AuthSession.user_id == User.id)
        .where(
            AuthSession.token_hash == hash_session_token(token),
            AuthSession.expires_at > datetime.now(timezone.utc),
        )
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None
    await db.execute(
        update(AuthSession)
        .where(AuthSession.token_hash == hash_session_token(token))
        .values(last_seen_at=datetime.now(timezone.utc))
    )
    await db.commit()
    return user


async def destroy_user_session(db: AsyncSession, token: str) -> None:
    await db.execute(
        AuthSession.__table__.delete().where(
            AuthSession.token_hash == hash_session_token(token)
        )
    )
    await db.commit()


class WrongPasswordError(AppError):
    def __init__(self) -> None:
        super().__init__(ErrorCode.VALIDATION_ERROR, "当前密码不正确", status_code=400)


async def change_own_password(
    db: AsyncSession,
    user: User,
    *,
    current_password: str,
    new_password: str,
    current_token: str | None,
) -> None:
    """Change the caller's password and sign out every OTHER device."""
    if not verify_password(current_password, user.password_hash):
        raise WrongPasswordError()

    user.password_hash = hash_password(new_password)
    await db.commit()

    stmt = AuthSession.__table__.delete().where(AuthSession.user_id == user.id)
    if current_token:
        stmt = stmt.where(AuthSession.token_hash != hash_session_token(current_token))
    await db.execute(stmt)
    await db.commit()


async def admin_reset_password(
    db: AsyncSession, target: User, *, new_password: str
) -> None:
    """Admin password reset: all of the target user's sessions are dropped,
    forcing a fresh login everywhere."""
    target.password_hash = hash_password(new_password)
    await db.commit()
    await db.execute(
        AuthSession.__table__.delete().where(AuthSession.user_id == target.id)
    )
    await db.commit()


async def update_user_profile(
    db: AsyncSession,
    user: User,
    *,
    display_name: str | None = None,
    avatar_url: str | None = None,
) -> User:
    if display_name is not None:
        user.display_name = display_name
    if avatar_url is not None:
        user.avatar_url = avatar_url
    await db.commit()
    await db.refresh(user)
    return user


def session_cookie_max_age() -> int:
    return get_settings().session_lifetime_days * 86400


async def purge_expired_sessions(db: AsyncSession) -> int:
    result = await db.execute(
        AuthSession.__table__.delete().where(
            AuthSession.expires_at < datetime.now(timezone.utc)
        )
    )
    await db.commit()
    return result.rowcount or 0


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await db.get(User, user_id)
