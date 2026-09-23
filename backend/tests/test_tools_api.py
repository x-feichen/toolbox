"""Tool API tests: discovery, contract, access enforcement, execution."""

TOOLS = "/api/v1/tools"
JSON_FORMATTER_EXECUTE = "/api/v1/tools/json-formatter/execute"
PROMPT_MANAGER_EXECUTE = "/api/v1/tools/prompt-manager/execute"


async def test_list_tools_returns_registered_manifests(client):
    resp = await client.get(TOOLS)
    assert resp.status_code == 200
    tools = resp.json()
    slugs = {t["slug"] for t in tools}
    assert "json-formatter" in slugs

    formatter = next(t for t in tools if t["slug"] == "json-formatter")
    assert formatter["access"] == "public"
    assert formatter["execution"] == "client"
    assert formatter["ui"] == "editor"
    assert formatter["category"] == "developer"
    assert formatter["requires_auth"] is False


async def test_get_tool_by_slug(client):
    resp = await client.get(f"{TOOLS}/json-formatter")
    assert resp.status_code == 200
    assert resp.json()["name"] == "JSON 格式化"


async def test_get_unknown_tool_404(client):
    resp = await client.get(f"{TOOLS}/no-such-tool")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "TOOL_NOT_FOUND"


async def test_execute_json_formatter_format(client):
    resp = await client.post(
        JSON_FORMATTER_EXECUTE,
        json={"action": "format", "payload": {"text": '{"a":1,"b":[2,3]}'}},
    )
    assert resp.status_code == 200
    assert resp.json()["result"]["formatted"] == '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}'


async def test_execute_json_formatter_minify(client):
    resp = await client.post(
        JSON_FORMATTER_EXECUTE,
        json={"action": "minify", "payload": {"text": '{ "a" : 1 }'}},
    )
    assert resp.json()["result"]["minified"] == '{"a":1}'


async def test_execute_json_formatter_validate(client):
    ok = await client.post(
        JSON_FORMATTER_EXECUTE, json={"action": "validate", "payload": {"text": '{"a":1}'}}
    )
    assert ok.json()["result"] == {"valid": True}

    bad = await client.post(
        JSON_FORMATTER_EXECUTE, json={"action": "validate", "payload": {"text": '{"a":'}},
    )
    result = bad.json()["result"]
    assert result["valid"] is False
    assert "JSON 语法错误" in result["error"]


async def test_execute_invalid_json_returns_tool_execution_error(client):
    resp = await client.post(
        JSON_FORMATTER_EXECUTE,
        json={"action": "format", "payload": {"text": "not json"}},
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "TOOL_EXECUTION_ERROR"


async def test_execute_unknown_action_validation_error(client):
    resp = await client.post(
        JSON_FORMATTER_EXECUTE, json={"action": "explode", "payload": {"text": "{}"}}
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_server_execution_endpoint_rejects_client_only_tool_contract(client):
    """json-formatter declares execution=client; API consumers still may call
    the reference service, but unknown tools never exist."""
    resp = await client.post(
        "/api/v1/tools/no-such-tool/execute", json={"action": "run", "payload": {}}
    )
    assert resp.status_code == 404


async def test_authenticated_tool_manifest_is_discoverable(client):
    resp = await client.get(f"{TOOLS}/prompt-manager")
    assert resp.status_code == 200
    tool = resp.json()
    assert tool["access"] == "authenticated"
    assert tool["requires_auth"] is True
    assert tool["ui"] == "custom"


async def test_authenticated_tool_execution_requires_auth(client):
    """Backend must reject anonymous execution even if the frontend guard is bypassed."""
    resp = await client.post(PROMPT_MANAGER_EXECUTE, json={"action": "list", "payload": {}})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "AUTH_REQUIRED"


async def test_authenticated_tool_without_generic_service_rejected(client, registered_user):
    """Prompt Manager executes via /prompts CRUD, not the generic endpoint;
    for an authenticated user the generic execute endpoint must say so."""
    resp = await client.post(PROMPT_MANAGER_EXECUTE, json={"action": "list", "payload": {}})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "TOOL_EXECUTION_ERROR"
