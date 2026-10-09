"""每日资讯工具 manifest — public + server 读取（custom UI）。

数据来自外部 Horizon PostgreSQL（只读），因此 execution=server；
界面为列表 + 详情的自定义工作区。免登录浏览。
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="daily-news",
    name="每日资讯",
    description="浏览 Horizon 每日新闻摘要",
    category="data",
    tags=["news", "daily", "markdown"],
    icon="newspaper",
    access="public",
    execution="server",
    ui="custom",
)

registry.register(manifest)
