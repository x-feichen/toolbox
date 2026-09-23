"""JSON Formatter tool — public + client-executed (editor UI).

The browser formats JSON locally; the server service exists as a reference
implementation of the ToolService contract and for API consumers. No input is
ever persisted (design doc §24).
"""

from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel, Field

from app.tools.base import ToolActionError, ToolManifest
from app.tools.registry import registry


class _ExecuteIn(BaseModel):
    text: str = Field(min_length=0, max_length=5_000_000)
    indent: int = Field(default=2, ge=0, le=8)


def _parse_with_position(text: str) -> Any:
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        line = exc.lineno
        col = exc.colno
        raise ToolActionError(f"JSON 语法错误（第 {line} 行, 第 {col} 列）: {exc.msg}") from exc


class JsonFormatterService:
    def actions(self) -> list[str]:
        return ["format", "minify", "validate"]

    async def execute(self, action: str, payload: dict[str, Any]) -> dict[str, Any]:
        data = _ExecuteIn(**payload)
        if action == "format":
            value = _parse_with_position(data.text)
            return {"formatted": json.dumps(value, ensure_ascii=False, indent=data.indent or None)}
        if action == "minify":
            value = _parse_with_position(data.text)
            return {"minified": json.dumps(value, ensure_ascii=False, separators=(",", ":"))}
        if action == "validate":
            try:
                _parse_with_position(data.text)
            except ToolActionError as exc:
                return {"valid": False, "error": exc.message}
            return {"valid": True}
        raise ToolActionError(f"未知操作: {action}")


manifest = ToolManifest(
    slug="json-formatter",
    name="JSON 格式化",
    description="格式化、压缩和校验 JSON",
    category="developer",
    tags=["json", "formatter", "developer"],
    icon="braces",
    access="public",
    execution="client",
    ui="editor",
)

registry.register(manifest, JsonFormatterService())
