"""Shared pytest fixtures.

Tests run against in-memory SQLite for hermeticity; CI can override
DATABASE_URL to run the same suite against PostgreSQL.
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import create_app
from app.models import Tool  # noqa: F401
from app.tools.registry import load_tools, registry


@pytest_asyncio.fixture
async def db_engine(tmp_path):
    # File-backed SQLite keeps tests hermetic. (In-memory + StaticPool hits a
    # SQLAlchemy 2.0.54 regression with async engines.)
    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncSession:
    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine):
    """HTTP client bound to the app with the test database injected."""

    load_tools()

    factory = async_sessionmaker(db_engine, expire_on_commit=False)
    app = create_app()

    async def override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    # Mirror registry metadata so favorites/history FKs to tools.slug resolve.
    async with factory() as session:
        await registry.sync_to_db(session)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def registered_user(client: AsyncClient) -> dict:
    """A registered + logged-in user; returns {email, password, cookies}."""
    payload = {"email": "alice@example.com", "password": "correct-horse-1", "display_name": "Alice"}
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return payload


@pytest_asyncio.fixture
async def second_user(client: AsyncClient) -> dict:
    payload = {"email": "bob@example.com", "password": "battery-staple-2"}
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return payload
