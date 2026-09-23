"""Prompt API tests: CRUD + strict per-user ownership isolation."""

from httpx import AsyncClient

PROMPTS = "/api/v1/prompts"


async def _create(client: AsyncClient, **overrides) -> dict:
    payload = {"title": "SEO 分析", "content": "写一篇 SEO 分析", "category": "写作", **overrides}
    resp = await client.post(PROMPTS, json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_prompts_require_auth(client):
    resp = await client.get(PROMPTS)
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "AUTH_REQUIRED"


async def test_create_and_list_prompts(client, registered_user):
    created = await _create(client)
    listed = (await client.get(PROMPTS)).json()
    assert len(listed) == 1
    assert listed[0]["id"] == created["id"]
    assert listed[0]["title"] == "SEO 分析"


async def test_update_prompt(client, registered_user):
    created = await _create(client)
    resp = await client.patch(
        f"{PROMPTS}/{created['id']}", json={"title": "新标题", "is_pinned": True}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "新标题"
    assert body["is_pinned"] is True
    assert body["content"] == "写一篇 SEO 分析"  # untouched field preserved


async def test_delete_prompt(client, registered_user):
    created = await _create(client)
    resp = await client.delete(f"{PROMPTS}/{created['id']}")
    assert resp.status_code == 204
    listed = (await client.get(PROMPTS)).json()
    assert listed == []


async def test_owner_isolation_user_b_cannot_read_user_a_prompt(client, registered_user, second_user):
    """The core permission invariant (design doc §20).

    register auto-logs-in, so after the second_user fixture the session is
    Bob's; explicitly sign back in as Alice to create her prompt.
    """
    client.cookies.clear()
    await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    created = await _create(client)  # belongs to alice

    client.cookies.clear()
    await client.post(
        "/api/v1/auth/login",
        json={"email": second_user["email"], "password": second_user["password"]},
    )

    resp = await client.get(f"{PROMPTS}/{created['id']}")
    assert resp.status_code == 404  # NOT_FOUND, never FORBIDDEN (no existence leak)
    assert resp.json()["error"]["code"] == "NOT_FOUND"

    patch = await client.patch(f"{PROMPTS}/{created['id']}", json={"title": "hijack"})
    assert patch.status_code == 404

    delete = await client.delete(f"{PROMPTS}/{created['id']}")
    assert delete.status_code == 404

    # And B's list never contains A's prompt
    b_list = (await client.get(PROMPTS)).json()
    assert b_list == []


async def test_filter_by_query_and_pinned(client, registered_user):
    await _create(client, title="JSON 工具提示")
    pinned = await _create(client, title="API 文档")
    await client.patch(f"{PROMPTS}/{pinned['id']}", json={"is_pinned": True})

    by_q = (await client.get(PROMPTS, params={"q": "JSON"})).json()
    assert [p["title"] for p in by_q] == ["JSON 工具提示"]

    by_pinned = (await client.get(PROMPTS, params={"pinned": True})).json()
    assert [p["title"] for p in by_pinned] == ["API 文档"]

    by_cat = (await client.get(PROMPTS, params={"category": "写作"})).json()
    assert len(by_cat) == 2


async def test_pinned_sort_order(client, registered_user):
    """Pinned prompts come first (by pin time desc), rest by created time desc."""
    old = await _create(client, title="早期提示词")
    first = await _create(client, title="第一条")
    second = await _create(client, title="第二条")

    # Pin the older prompt first, then the newer one — pin time decides order.
    await client.patch(f"{PROMPTS}/{old['id']}", json={"is_pinned": True})
    await client.patch(f"{PROMPTS}/{first['id']}", json={"is_pinned": True})

    listed = (await client.get(PROMPTS)).json()
    titles = [p["title"] for p in listed]
    assert titles.index("第一条") < titles.index("早期提示词")  # pinned first, pin time desc
    assert titles[-1] == "第二条"  # newest unpinned is last? no — created desc puts it first

    # Unpin one and check ordering: still-pinned first, unpinned by created desc.
    await client.patch(f"{PROMPTS}/{first['id']}", json={"is_pinned": False})
    after_unpin = (await client.get(PROMPTS)).json()
    assert after_unpin[0]["title"] == "早期提示词"  # pinned stays on top
    # SQLite's now() has second precision, so the two unpinned prompts may
    # share created_at; just assert both follow the pinned one.
    assert {p["title"] for p in after_unpin[1:]} == {"第一条", "第二条"}


async def test_categories_endpoint(client, registered_user):
    await _create(client, category="写作")
    await _create(client, title="另一个", category="编码")
    cats = (await client.get(f"{PROMPTS}/categories")).json()
    assert cats == ["写作", "编码"]
