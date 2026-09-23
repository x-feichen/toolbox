"""History routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_current_user
from app.auth.models import User
from app.core.database import get_db
from app.history import service as history_service
from app.history.schemas import HistoryCreateIn, HistoryOut

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryOut])
async def list_history(
    limit: int = Query(default=20, ge=1, le=100),
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[HistoryOut]:
    entries = await history_service.list_history(db, user_id=user.id, limit=limit)
    return [HistoryOut.model_validate(e) for e in entries]


@router.get("/recent", response_model=list[str])
async def recent_tools(
    limit: int = Query(default=8, ge=1, le=20),
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    return await history_service.recent_tool_slugs(db, user_id=user.id, limit=limit)


@router.post("", response_model=HistoryOut, status_code=status.HTTP_201_CREATED)
async def record_history(
    data: HistoryCreateIn,
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> HistoryOut:
    await history_service.record_usage(db, user_id=user.id, tool_slug=data.tool_slug)
    return HistoryOut(tool_slug=data.tool_slug, executed_at=history_service.now_utc())


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_history(
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await history_service.clear_history(db, user_id=user.id)
