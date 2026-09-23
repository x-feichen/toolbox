"""图片压缩 manifest — public + client-executed (upload UI).

Runs entirely in the browser; no server service is bound (per the frontend
tool implementation plan). The manifest exists for discovery, navigation
and search.
"""

from __future__ import annotations

from app.tools.base import ToolManifest
from app.tools.registry import registry

manifest = ToolManifest(
    slug="image-compressor",
    name="图片压缩",
    description="浏览器本地压缩 JPG/PNG/WebP，不上传服务器",
    category="image",
    tags=["image", "compress"],
    icon="image-down",
    access="public",
    execution="client",
    ui="upload",
)

registry.register(manifest)
