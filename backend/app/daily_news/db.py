"""Horizon 数据库 asyncpg 连接池（移植自 nanobot.daily_news.db）。

日志从 loguru 改为标准 logging，与本项目规范一致；其余逻辑保持原样。
"""

from __future__ import annotations

import logging

import asyncpg

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def get_pool(database_url: str) -> asyncpg.Pool:
    """获取或创建连接池（单例模式）。"""
    global _pool
    if _pool is None:
        # 日志中隐去凭据：只显示 host:port/db 部分
        logger.debug("创建 asyncpg 连接池: %s", database_url.split("@")[-1])
        _pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)
    return _pool


async def close_pool() -> None:
    """关闭连接池。"""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.debug("asyncpg 连接池已关闭")
