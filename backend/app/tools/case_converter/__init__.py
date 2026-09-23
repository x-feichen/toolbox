"""大小写转换 manifest — public + client-executed (form UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="case-converter",
    name="大小写转换",
    description="UPPER / lower / camel / snake / kebab 等格式",
    category="text",
    tags=["text", "case"],
    icon="case-upper",
    access="public",
    execution="client",
    ui="form",
)

registry.register(manifest)
