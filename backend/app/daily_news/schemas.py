"""每日资讯 API 输出 schema（与前端 types.ts 保持一致）。"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.daily_news.models import DailySummary


class DailySummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    language: str
    total_fetched: int
    item_count: int
    markdown: str
    created_at: datetime


class DailySummariesOut(BaseModel):
    summaries: list[DailySummaryOut]
    has_more: bool

    @classmethod
    def from_models(cls, items: list[DailySummary], *, limit: int) -> DailySummariesOut:
        # 请求条数读满即视为还有更多（与原 nanobot 网关行为一致）。
        has_more = len(items) == limit and limit > 0
        return cls(
            summaries=[DailySummaryOut.model_validate(item) for item in items],
            has_more=has_more,
        )
