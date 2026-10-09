"""每日资讯数据模型（移植自 nanobot.daily_news.models）。"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime


@dataclass(frozen=True)
class DailySummary:
    """每日摘要条目。"""

    id: int
    date: date
    language: str
    total_fetched: int
    item_count: int
    markdown: str
    created_at: datetime
