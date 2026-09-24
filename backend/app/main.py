"""ToolBox API application factory."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from urllib.parse import urlsplit

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app import models  # noqa: F401  (registers all ORM models on Base.metadata)
from app.auth import service as auth_service
from app.auth.router import router as auth_router
from app.core.config import get_settings
from app.core.database import Base, engine, async_session_factory
from app.core.errors import ErrorCode, install_error_handlers
from app.core.logging import setup_logging
from app.favorites.router import router as favorites_router
from app.history.router import router as history_router
from app.prompts.router import router as prompts_router
from app.tools.router import router as tools_router
from app.tools.registry import load_tools, registry
from app.users.router import router as users_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging("DEBUG" if not settings.is_production else "INFO")

    # Load code-defined tools and mirror their metadata into the DB.
    load_tools()
    async with async_session_factory() as db:
        await registry.sync_to_db(db)

    if not settings.is_production:
        # Development convenience only; production uses Alembic migrations.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    logger.info("ToolBox API started (env=%s, tools=%d)", settings.app_env, len(registry))
    yield
    await engine.dispose()


def _install_csrf_protection(app: FastAPI) -> None:
    """SameSite=Lax cookie + Origin validation combo (design doc §54).

    Browser clients always send Origin on unsafe cross-site requests. An
    unsafe request is allowed when either:
      • Origin matches the Host it was sent to (same-origin request through
        the reverse proxy — works on any deployment domain/IP without
        configuration), or
      • Origin is explicitly whitelisted in CORS_ORIGINS (split deployments
        where the frontend lives on another origin).

    A request without an Origin header is not browser-originated CSRF
    (curl, server-to-server) and passes; the session cookie still applies.
    """

    @app.middleware("http")
    async def csrf_origin_check(request: Request, call_next):
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            origin = request.headers.get("origin")
            if origin and not _origin_allowed(request, origin):
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": {"code": ErrorCode.FORBIDDEN, "message": "CSRF 校验失败"}},
                )
        return await call_next(request)


def _origin_allowed(request: Request, origin: str) -> bool:
    settings = get_settings()
    if origin in settings.cors_origin_list:
        return True
    host = request.headers.get("host", "")
    return bool(host) and urlsplit(origin).netloc == host


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="ToolBox API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/api/docs",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
    _install_csrf_protection(app)
    install_error_handlers(app)

    for router in (auth_router, users_router, tools_router, prompts_router, favorites_router, history_router):
        app.include_router(router, prefix="/api/v1")

    @app.get("/api/v1/health", tags=["system"])
    async def health() -> dict:
        # Lightweight liveness probe; a DB roundtrip check lives in readiness.
        async with async_session_factory() as db:
            await db.execute(text("SELECT 1"))
        return {"status": "ok"}

    return app


app = create_app()
