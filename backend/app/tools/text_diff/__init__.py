"""文本对比 manifest — public + client-executed (split UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="text-diff",
    name="文本对比",
    description="逐行比较两段文本的差异",
    category="text",
    tags=["diff", "compare"],
    icon="git-compare",
    access="public",
    execution="client",
    ui="split",
)

registry.register(manifest)
