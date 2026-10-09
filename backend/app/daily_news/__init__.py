"""每日资讯模块 — 移植自 nanobot.daily_news。

只读视图层：数据由外部 Horizon 项目流水线抓取并生成，写入其 PostgreSQL
数据库的 daily_summaries 表；本模块通过独立的 asyncpg 连接池只读查询，
不做抓取、不做 LLM 调用、无定时任务。

数据库连接串通过 DAILY_NEWS_DATABASE_URL 环境变量提供；未配置时模块
返回 503（不启用），其余 API 不受影响。
"""
