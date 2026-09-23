"""CSV ↔ JSON manifest — public + client-executed (split UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="csv-json",
    name="CSV ↔ JSON",
    description="CSV 与 JSON 相互转换（支持引号/换行/UTF-8）",
    category="data",
    tags=["csv", "json", "convert"],
    icon="table-2",
    access="public",
    execution="client",
    ui="split",
)

registry.register(manifest)
