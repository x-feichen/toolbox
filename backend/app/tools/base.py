"""Tool Contract — the most important interface of the platform.

A tool declares *who it is* (manifest) and optionally *how it runs on the
server* (service). Everything else (navigation, discovery, permissions,
rendering) is handled by the platform.

Contract dimensions (design doc §17):
- Access:     public | authenticated
- Execution:  client | server | hybrid
- UI:         form | editor | upload | viewer | custom
"""

from __future__ import annotations

from typing import Any, Literal, Protocol

from pydantic import BaseModel, Field

AccessType = Literal["public", "authenticated"]
ExecutionMode = Literal["client", "server", "hybrid"]
UIType = Literal["form", "editor", "upload", "viewer", "custom"]
ToolStatus = Literal["draft", "beta", "stable", "deprecated"]
ToolCategory = Literal["developer", "text", "data", "image", "ai", "other"]


class ToolManifest(BaseModel):
    """Declarative metadata every tool must provide."""

    slug: str = Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$", max_length=100)
    name: str = Field(max_length=200)
    description: str = Field(default="", max_length=500)
    category: ToolCategory = "other"
    tags: list[str] = Field(default_factory=list, max_length=20)
    icon: str | None = None
    version: str = Field(default="1.0.0", pattern=r"^\d+\.\d+\.\d+$")
    status: ToolStatus = "stable"

    access: AccessType = "public"
    execution: ExecutionMode = "client"
    ui: UIType = "form"


class ToolActionError(Exception):
    """Raised by a tool service when execution fails; mapped to a 400 response."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ToolService(Protocol):
    """Contract for server-executed tools."""

    def actions(self) -> list[str]:
        """List of supported action names."""
        ...

    async def execute(self, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Run an action and return a JSON-serializable result."""
        ...


class RegisteredTool:
    """A manifest bound to its optional server-side service."""

    def __init__(self, manifest: ToolManifest, service: ToolService | None = None) -> None:
        self.manifest = manifest
        self.service = service

    @property
    def requires_auth(self) -> bool:
        return self.manifest.access == "authenticated"
