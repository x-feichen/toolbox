"""Favorites & History API tests."""

from httpx import AsyncClient

FAVORITES = "/api/v1/favorites"
HISTORY = "/api/v1/history"


async def test_favorites_require_auth(client):
    resp = await client.get(FAVORITES)
    assert resp.status_code == 401


async def test_favorite_add_list_remove_idempotent(client, registered_user):
    resp = await client.post(FAVORITES, json={"tool_slug": "json-formatter"})
    assert resp.status_code == 201

    # Duplicate add is idempotent, not an error
    again = await client.post(FAVORITES, json={"tool_slug": "json-formatter"})
    assert again.status_code == 201

    listed = (await client.get(FAVORITES)).json()
    assert [f["tool_slug"] for f in listed] == ["json-formatter"]

    remove = await client.delete(f"{FAVORITES}/json-formatter")
    assert remove.status_code == 204
    assert (await client.get(FAVORITES)).json() == []

    # Removing a non-favorite is 404
    missing = await client.delete(f"{FAVORITES}/json-formatter")
    assert missing.status_code == 404


async def test_favorite_unknown_tool_404(client, registered_user):
    resp = await client.post(FAVORITES, json={"tool_slug": "no-such-tool"})
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "TOOL_NOT_FOUND"


async def test_favorites_are_user_scoped(client, registered_user, second_user):
    # register auto-logs-in; sign back in as Alice before favoriting.
    client.cookies.clear()
    await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    await client.post(FAVORITES, json={"tool_slug": "json-formatter"})

    client.cookies.clear()
    await client.post(
        "/api/v1/auth/login",
        json={"email": second_user["email"], "password": second_user["password"]},
    )
    assert (await client.get(FAVORITES)).json() == []


async def test_history_record_and_list(client, registered_user):
    resp = await client.post(HISTORY, json={"tool_slug": "json-formatter"})
    assert resp.status_code == 201

    resp = await client.post(HISTORY, json={"tool_slug": "json-formatter"})
    entries = (await client.get(HISTORY)).json()
    assert len(entries) == 2
    assert all(e["tool_slug"] == "json-formatter" for e in entries)


async def test_history_recent_deduplicated(client, registered_user):
    for _ in range(3):
        await client.post(HISTORY, json={"tool_slug": "json-formatter"})
    await client.post(HISTORY, json={"tool_slug": "prompt-manager"})

    recent = (await client.get(f"{HISTORY}/recent")).json()
    assert recent == ["prompt-manager", "json-formatter"]


async def test_history_clear(client, registered_user):
    await client.post(HISTORY, json={"tool_slug": "json-formatter"})
    resp = await client.delete(HISTORY)
    assert resp.status_code == 204
    assert (await client.get(HISTORY)).json() == []


async def test_history_unknown_tool_404(client, registered_user):
    resp = await client.post(HISTORY, json={"tool_slug": "no-such-tool"})
    assert resp.status_code == 404


async def test_history_requires_auth(client):
    resp = await client.get(HISTORY)
    assert resp.status_code == 401
