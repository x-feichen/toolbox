"""时间戳转换 manifest — public + client-executed (form UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="timestamp-converter",
    name="时间戳转换",
    description="Unix 时间戳与日期互转（秒/毫秒）",
    category="developer",
    tags=["timestamp", "date"],
    icon="clock",
    access="public",
    execution="client",
    ui="form",
)

registry.register(manifest)
