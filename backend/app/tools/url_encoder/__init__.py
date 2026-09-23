"""URL 编解码 manifest — public + client-executed (form UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="url-encoder",
    name="URL 编解码",
    description="URL 组件编码与解码",
    category="developer",
    tags=["url", "encoding"],
    icon="link",
    access="public",
    execution="client",
    ui="form",
)

registry.register(manifest)
