"""Prompt Manager manifest — authenticated + server + custom UI.

Its execution goes through the dedicated /api/v1/prompts CRUD API (a
"custom" workspace tool), so no generic ToolService is bound here; the
manifest exists for discovery, navigation and access control.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="prompt-manager",
    name="Prompt 管理",
    description="保存和管理你的 Prompt",
    category="ai",
    tags=["prompt", "ai"],
    icon="sparkles",
    access="authenticated",
    execution="server",
    ui="custom",
)

registry.register(manifest)
