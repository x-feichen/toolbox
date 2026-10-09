"""每日资讯查询服务（移植自 nanobot.daily_news.service）。"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.daily_news.db import get_pool
from app.daily_news.models import DailySummary

if TYPE_CHECKING:
    import asyncpg


async def list_summaries(
    database_url: str,
    *,
    language: str | None = None,
    limit: int = 30,
    offset: int = 0,
) -> list[DailySummary]:
    """查询每日资讯列表（按日期倒序）。"""
    pool = await get_pool(database_url)
    if language:
        rows = await pool.fetch(
            "SELECT id, date, language, total_fetched, item_count, markdown, created_at "
            "FROM daily_summaries WHERE language = $1 "
            "ORDER BY date DESC, id DESC LIMIT $2 OFFSET $3",
            language,
            limit,
            offset,
        )
    else:
        rows = await pool.fetch(
            "SELECT id, date, language, total_fetched, item_count, markdown, created_at "
            "FROM daily_summaries "
            "ORDER BY date DESC, id DESC LIMIT $1 OFFSET $2",
            limit,
            offset,
        )
    return [_row_to_summary(r) for r in rows]


async def get_summary(database_url: str, summary_id: int) -> DailySummary | None:
    """查询单条每日资讯。"""
    pool = await get_pool(database_url)
    row = await pool.fetchrow(
        "SELECT id, date, language, total_fetched, item_count, markdown, created_at "
        "FROM daily_summaries WHERE id = $1",
        summary_id,
    )
    if row is None:
        return None
    return _row_to_summary(row)


def _row_to_summary(row: asyncpg.Record) -> DailySummary:
    return DailySummary(
        id=row["id"],
        date=row["date"],
        language=row["language"],
        total_fetched=row["total_fetched"],
        item_count=row["item_count"],
        markdown=row["markdown"],
        created_at=row["created_at"],
    )
