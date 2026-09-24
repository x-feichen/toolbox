"""CSRF Origin validation: same-origin requests pass on any deployment host,
cross-origin requests require an explicit whitelist entry (design doc §54).
"""

HISTORY = "/api/v1/history"


async def test_same_origin_request_is_allowed(client):
    """Origin matching the request Host = same-origin via reverse proxy."""
    resp = await client.post(
        HISTORY,
        json={"tool_slug": "json-formatter"},
        headers={"Origin": "http://test", "Host": "test"},
    )
    # Not 403: CSRF passed; 401 because this anonymous call has no session.
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "AUTH_REQUIRED"


async def test_cross_origin_request_is_rejected(client):
    resp = await client.post(
        HISTORY,
        json={"tool_slug": "json-formatter"},
        headers={"Origin": "http://evil.example", "Host": "test"},
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


async def test_whitelisted_origin_is_allowed(client):
    """CORS_ORIGINS entries keep working for split deployments."""
    # CORS_ORIGINS defaults to http://localhost:3000 in test settings.
    resp = await client.post(
        HISTORY,
        json={"tool_slug": "json-formatter"},
        headers={"Origin": "http://localhost:3000", "Host": "test"},
    )
    assert resp.status_code == 401  # CSRF passed (no session present)


async def test_request_without_origin_passes(client):
    """Non-browser callers (curl, server-to-server) carry no Origin."""
    resp = await client.post(HISTORY, json={"tool_slug": "json-formatter"})
    assert resp.status_code == 401  # reaches the auth layer
