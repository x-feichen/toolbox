"""Avatar upload/read/delete tests backed by an in-memory storage fake."""

from __future__ import annotations

import pytest
import pytest_asyncio

from app.avatars import router as avatars_router
from app.storage.base import ObjectNotFound
from tests.fake_storage import InMemoryStorage

AVATARS = "/api/v1/avatars"

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 32
JPEG = b"\xff\xd8\xff" + b"0" * 32


@pytest_asyncio.fixture
def storage(monkeypatch) -> InMemoryStorage:
    fake = InMemoryStorage()
    # Patch the router's reference (it imported get_storage directly).
    monkeypatch.setattr(avatars_router, "get_storage", lambda: fake)
    return fake


async def test_upload_requires_authentication(client, storage):
    resp = await client.post(AVATARS, files={"file": ("a.png", PNG, "image/png")})
    assert resp.status_code == 401


async def test_upload_stores_object_and_updates_user(client, storage, registered_user):
    resp = await client.post(AVATARS, files={"file": ("a.png", PNG, "image/png")})
    assert resp.status_code == 201
    avatar_url = resp.json()["avatar_url"]
    assert avatar_url.startswith(f"{AVATARS}/avatars/")

    # object landed in storage with the right content type
    assert len(storage.put_calls) == 1
    key = storage.put_calls[0]
    assert key.endswith(".png")
    assert storage.get_object(key).data == PNG
    assert storage.get_object(key).content_type == "image/png"


async def test_upload_rejects_unsupported_type(client, storage, registered_user):
    resp = await client.post(AVATARS, files={"file": ("a.gif", b"GIF89a", "image/gif")})
    assert resp.status_code == 415
    assert storage.put_calls == []


async def test_upload_rejects_oversized_file(client, storage, registered_user):
    big = PNG + b"0" * (2 * 1024 * 1024)
    resp = await client.post(AVATARS, files={"file": ("big.png", big, "image/png")})
    assert resp.status_code == 413


async def test_replacing_avatar_deletes_previous_object(client, storage, registered_user):
    first = await client.post(AVATARS, files={"file": ("a.png", PNG, "image/png")})
    old_key = storage.put_calls[0]

    second = await client.post(AVATARS, files={"file": ("b.jpg", JPEG, "image/jpeg")})
    assert second.status_code == 201
    assert storage.put_calls[1].endswith(".jpg")
    assert old_key in storage.delete_calls  # previous file removed
    assert old_key not in storage.objects


async def test_avatar_read_is_public_with_cache_headers(client, storage, registered_user):
    up = await client.post(AVATARS, files={"file": ("a.png", PNG, "image/png")})
    key = storage.put_calls[0]

    # no cookies at all: still readable (gravatar-style public access)
    client.cookies.clear()
    resp = await client.get(f"{AVATARS}/{key}")
    assert resp.status_code == 200
    assert resp.content == PNG
    assert resp.headers["content-type"] == "image/png"
    assert "immutable" in resp.headers["cache-control"]
    assert "max-age=31536000" in resp.headers["cache-control"]
    assert resp.headers["etag"]


async def test_avatar_read_missing_returns_404(client, storage):
    client.cookies.clear()
    resp = await client.get(f"{AVATARS}/avatars/nobody/none.png")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


async def test_delete_avatar_clears_field_and_object(client, storage, registered_user):
    await client.post(AVATARS, files={"file": ("a.png", PNG, "image/png")})
    key = storage.put_calls[0]

    resp = await client.delete(AVATARS)
    assert resp.status_code == 204
    assert key in storage.delete_calls
    assert key not in storage.objects

    me = await client.get("/api/v1/auth/me")
    assert me.json()["avatar_url"] is None


async def test_delete_avatar_without_avatar_is_noop(client, storage, registered_user):
    resp = await client.delete(AVATARS)
    assert resp.status_code == 204
    assert storage.delete_calls == []


async def test_delete_only_touches_own_avatar(client, storage, registered_user, second_user):
    # sign in as alice explicitly (the second_user fixture left bob's cookie)
    client.cookies.clear()
    await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    await client.post(AVATARS, files={"file": ("a.png", PNG, "image/png")})
    my_key = storage.put_calls[0]

    # sign in as the other user and delete "their" (nonexistent) avatar
    client.cookies.clear()
    await client.post(
        "/api/v1/auth/login",
        json={"email": second_user["email"], "password": second_user["password"]},
    )
    resp = await client.delete(AVATARS)
    assert resp.status_code == 204
    # alice's object untouched
    assert my_key in storage.objects
    assert storage.delete_calls == []
