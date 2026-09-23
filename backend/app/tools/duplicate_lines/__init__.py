"""去除重复行 manifest — public + client-executed (editor UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="duplicate-lines",
    name="去除重复行",
    description="删除重复行，保留顺序，支持忽略空行与大小写",
    category="text",
    tags=["text", "dedupe"],
    icon="list-filter",
    access="public",
    execution="client",
    ui="editor",
)

registry.register(manifest)
