"""UUID 生成器 manifest — public + client-executed (form UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="uuid-generator",
    name="UUID 生成器",
    description="批量生成 UUID v4",
    category="developer",
    tags=["uuid", "id"],
    icon="fingerprint",
    access="public",
    execution="client",
    ui="form",
)

registry.register(manifest)
