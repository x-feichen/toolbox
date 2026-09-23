"""JWT 解码 manifest — public + client-executed (split UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="jwt-decoder",
    name="JWT 解码",
    description="解码 JWT 的 Header 与 Payload（仅解码，不验证签名）",
    category="developer",
    tags=["jwt", "token"],
    icon="key-round",
    access="public",
    execution="client",
    ui="split",
)

registry.register(manifest)
