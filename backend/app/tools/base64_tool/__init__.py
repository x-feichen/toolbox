"""Base64 编解码 manifest — public + client-executed (form UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="base64-tool",
    name="Base64 编解码",
    description="Base64 编码与解码（UTF-8 安全）",
    category="developer",
    tags=["base64", "encoding"],
    icon="binary",
    access="public",
    execution="client",
    ui="form",
)

registry.register(manifest)
