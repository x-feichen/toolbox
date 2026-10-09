"""每日资讯 API 测试。

Horizon 库不可在单测中访问，因此：
- 路由集成测试 mock `app.daily_news.service` 的查询函数；
- service 单元测试用 fake pool（dict 行兼容 asyncpg.Record 的下标访问）；
- 连接串未配置时的 503 行为也覆盖。
"""

from __future__ import annotations

from datetime import date, datetime, timezone

import pytest

from app.daily_news import db as daily_news_db
from app.daily_news import service as daily_news_service
from app.daily_news.models import DailySummary

SUMMARIES = "/api/v1/daily-news/summaries"


def _summary(id: int, language: str = "zh") -> DailySummary:
    return DailySummary(
        id=id,
        date=date(2026, 9, 24),
        language=language,
        total_fetched=120,
        item_count=8,
        markdown=f"# 摘要 {id}\n\n内容",
        created_at=datetime(2026, 9, 24, 8, 0, tzinfo=timezone.utc),
    )


@pytest.fixture
def horizon_url(monkeypatch) -> str:
    """Enable the module with a fake DSN and isolate the pool singleton."""
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "daily_news_database_url", "postgresql://fake/db")
    # 隔离模块级连接池单例，测试结束后恢复原值
    monkeypatch.setattr(daily_news_db, "_pool", None)
    return "postgresql://fake/db"


async def test_disabled_when_database_url_missing(client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "daily_news_database_url", "")
    resp = await client.get(SUMMARIES)
    assert resp.status_code == 503
    assert resp.json()["error"]["code"] == "SERVICE_UNAVAILABLE"


async def test_list_summaries_response_shape(client, horizon_url, monkeypatch):
    captured = {}

    async def fake_list(database_url, *, language=None, limit=30, offset=0):
        captured.update(database_url=database_url, language=language, limit=limit, offset=offset)
        return [_summary(1), _summary(2)]

    monkeypatch.setattr(daily_news_service, "list_summaries", fake_list)

    resp = await client.get(SUMMARIES, params={"limit": 2})
    assert resp.status_code == 200
    body = resp.json()
    assert body["has_more"] is True  # 读满 limit 即有更多
    assert len(body["summaries"]) == 2
    assert body["summaries"][0]["date"] == "2026-09-24"  # ISO 日期串
    assert body["summaries"][0]["created_at"] == "2026-09-24T08:00:00Z"  # ISO datetime
    assert captured["database_url"] == horizon_url
    assert captured["limit"] == 2


async def test_language_defaults_to_configured_value(client, horizon_url, monkeypatch):
    captured = {}

    async def fake_list(database_url, *, language=None, limit=30, offset=0):
        captured["language"] = language
        return []

    monkeypatch.setattr(daily_news_service, "list_summaries", fake_list)
    resp = await client.get(SUMMARIES)
    assert resp.status_code == 200
    assert resp.json()["has_more"] is False
    assert captured["language"] == "zh"


async def test_get_summary_404_when_missing(client, horizon_url, monkeypatch):
    async def fake_get(database_url, summary_id):
        return None

    monkeypatch.setattr(daily_news_service, "get_summary", fake_get)

    resp = await client.get("/api/v1/daily-news/summary/999")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


async def test_db_failure_maps_to_502(client, horizon_url, monkeypatch):
    import asyncpg

    async def fake_list(*args, **kwargs):
        raise asyncpg.PostgresError("connection refused")

    monkeypatch.setattr(daily_news_service, "list_summaries", fake_list)

    resp = await client.get(SUMMARIES)
    assert resp.status_code == 502
    assert resp.json()["error"]["code"] == "SERVICE_UNAVAILABLE"


async def test_service_row_mapping_with_fake_pool(monkeypatch, horizon_url):
    """fake pool 的 dict 行应能正确映射为 DailySummary。"""

    class FakePool:
        async def fetch(self, *args, **kwargs):
            return [
                {
                    "id": 7,
                    "date": date(2026, 9, 23),
                    "language": "zh",
                    "total_fetched": 100,
                    "item_count": 6,
                    "markdown": "# 标题",
                    "created_at": datetime(2026, 9, 23, 9, 0, tzinfo=timezone.utc),
                }
            ]

        async def fetchrow(self, *args, **kwargs):
            return None

        async def close(self):
            return None

    async def fake_create_pool(url, **kwargs):
        return FakePool()

    asyncpg = daily_news_db.asyncpg
    monkeypatch.setattr(asyncpg, "create_pool", fake_create_pool)

    items = await daily_news_service.list_summaries(horizon_url, limit=5)
    assert len(items) == 1
    assert items[0].id == 7
    assert items[0].markdown == "# 标题"

    missing = await daily_news_service.get_summary(horizon_url, 1)
    assert missing is None
