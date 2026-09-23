"""Tool API routes: discovery + server-side execution.

- Discovery is public; every tool's manifest tells the client how to render
  it and whether it requires login.
- Execution enforces access server-side; client-executed tools never need
  this endpoint (privacy-first: inputs are not persisted anywhere).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_current_user
from app.auth.models import User
from app.core.database import get_db
from app.core.errors import AppError, ErrorCode
from app.core.config import get_settings
from app.history import service as history_service
from app.tools import registry as registry_module
from app.tools.base import RegisteredTool
from app.tools.schemas import ToolExecuteIn, ToolExecuteOut, ToolOut

router = APIRouter(prefix="/tools", tags=["tools"])


def _get_registered_tool(slug: str) -> RegisteredTool:
    try:
        return registry_module.registry.get(slug)
    except KeyError:
        raise AppError(ErrorCode.TOOL_NOT_FOUND, "工具不存在", status_code=404) from None


@router.get("", response_model=list[ToolOut])
async def list_tools() -> list[ToolOut]:
    # Manifests live in code; timestamps are metadata-only and not tracked per
    # tool, so we expose the API boot time as a stable placeholder-free shape:
    # instead of fake timestamps we use the registry (code) as source of truth.
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    return [
        ToolOut.from_manifest(t.manifest, t.requires_auth, created_at=now, updated_at=now)
        for t in registry_module.registry.list()
    ]


@router.get("/{slug}", response_model=ToolOut)
async def get_tool(slug: str) -> ToolOut:
    tool = _get_registered_tool(slug)
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    return ToolOut.from_manifest(tool.manifest, tool.requires_auth, created_at=now, updated_at=now)


@router.post("/{slug}/execute", response_model=ToolExecuteOut)
async def execute_tool(
    slug: str,
    data: ToolExecuteIn,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_current_user),
) -> ToolExecuteOut:
    tool = _get_registered_tool(slug)

    # Backend security check — never trust the frontend guard alone.
    if tool.requires_auth:
        if user is None:
            raise AppError(ErrorCode.AUTH_REQUIRED, "请登录后使用该工具", status_code=401)

    if tool.service is None:
        raise AppError(
            ErrorCode.TOOL_EXECUTION_ERROR,
            "该工具在浏览器中执行，不提供服务器执行接口",
            status_code=400,
        )

    if data.action not in tool.service.actions():
        raise AppError(
            ErrorCode.VALIDATION_ERROR,
            f"不支持的操作: {data.action}（支持: {', '.join(tool.service.actions())}）",
            status_code=422,
        )

    try:
        result = await tool.service.execute(data.action, data.payload)
    except Exception as exc:
        detail = getattr(exc, "message", None) or "工具执行失败"
        raise AppError(ErrorCode.TOOL_EXECUTION_ERROR, str(detail), status_code=400) from exc

    # MVP history: record who used which tool when — never the tool input.
    if user is not None:
        await history_service.record_usage(db, user_id=user.id, tool_slug=slug)

    return ToolExecuteOut(result=result)
