"""Auth routes: register / login / logout / me."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import service as auth_service
from app.auth.dependencies import get_current_user, require_current_user
from app.auth.models import User
from app.auth.schemas import LoginIn, RegisterIn, UserOut
from app.core.config import get_settings
from app.core.database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=auth_service.session_cookie_max_age(),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    settings = get_settings()
    response.delete_cookie(
        key=settings.session_cookie_name, path="/", httponly=True, samesite="lax"
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterIn,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    user = await auth_service.register_user(
        db, email=data.email, password=data.password, display_name=data.display_name
    )
    # Auto-login after registration so the user lands inside the product.
    token = await auth_service.create_user_session(db, user)
    _set_session_cookie(response, token)
    return UserOut.model_validate(user)


@router.post("/login", response_model=UserOut)
async def login(
    data: LoginIn,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    user = await auth_service.authenticate_user(db, email=data.email, password=data.password)
    token = await auth_service.create_user_session(db, user)
    _set_session_cookie(response, token)
    return UserOut.model_validate(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> None:
    token = request.cookies.get(get_settings().session_cookie_name)
    if token:
        await auth_service.destroy_user_session(db, token)
    _clear_session_cookie(response)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(require_current_user)) -> UserOut:
    return UserOut.model_validate(user)
