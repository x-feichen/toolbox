"""字数统计 manifest — public + client-executed (form UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="word-counter",
    name="字数统计",
    description="统计字符、词数、行数、段落（支持中文）",
    category="text",
    tags=["text", "count"],
    icon="count",
    access="public",
    execution="client",
    ui="form",
)

registry.register(manifest)
