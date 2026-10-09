"""每日资讯路由 — FastAPI 版（原 nanobot/webui/daily_news_routes.py 的移植）。

公开只读接口（无需登录）：浏览资讯不涉及个人数据，符合「即开即用」原则。
数据来自外部 Horizon 库；未配置 DAILY_NEWS_DATABASE_URL 时模块禁用（503）。
"""

from __future__ import annotations

import logging

import asyncpg
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: F401 (reserved for future use)

from app.core.config import get_settings
from app.core.database import get_db
from app.core.errors import AppError, ErrorCode
from app.daily_news import service
from app.daily_news.schemas import DailySummariesOut, DailySummaryOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/daily-news", tags=["daily-news"])


def _database_url() -> str:
    settings = get_settings()
    if not settings.daily_news_database_url:
        raise AppError(
            ErrorCode.SERVICE_UNAVAILABLE,
            "每日资讯未配置数据源（DAILY_NEWS_DATABASE_URL）",
            status_code=503,
        )
    return settings.daily_news_database_url


@router.get("/summaries", response_model=DailySummariesOut)
async def list_summaries(
    language: str | None = Query(default=None, max_length=10),
    limit: int | None = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> DailySummariesOut:
    settings = get_settings()
    url = _database_url()
    effective_limit = limit if limit is not None else settings.daily_news_max_items
    effective_language = language if language is not None else settings.daily_news_language
    try:
        items = await service.list_summaries(
            url,
            language=effective_language,
            limit=effective_limit,
            offset=offset,
        )
    except asyncpg.PostgresError as exc:
        logger.error("daily news query failed: %s", exc)
        raise AppError(
            ErrorCode.SERVICE_UNAVAILABLE, "资讯数据暂时不可用，请稍后重试", status_code=502
        ) from exc
    return DailySummariesOut.from_models(items, limit=effective_limit)


@router.get("/summary/{summary_id}", response_model=DailySummaryOut)
async def get_summary(summary_id: int) -> DailySummaryOut:
    url = _database_url()
    try:
        item = await service.get_summary(url, summary_id)
    except asyncpg.PostgresError as exc:
        logger.error("daily news query failed: %s", exc)
        raise AppError(
            ErrorCode.SERVICE_UNAVAILABLE, "资讯数据暂时不可用，请稍后重试", status_code=502
        ) from exc
    if item is None:
        raise AppError(ErrorCode.NOT_FOUND, "资讯不存在", status_code=404)
    return DailySummaryOut.model_validate(item)
