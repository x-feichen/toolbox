"""Auth API tests: register / login / session / logout / me."""

REGISTER = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
ME = "/api/v1/auth/me"
LOGOUT = "/api/v1/auth/logout"


async def test_register_creates_user_and_session(client):
    resp = await client.post(
        REGISTER,
        json={"email": "new@example.com", "password": "long-password-1", "display_name": "New"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "new@example.com"
    assert body["display_name"] == "New"
    assert body["role"] == "user"
    assert "password" not in body
    assert "password_hash" not in body
    # Session cookie must be HttpOnly
    cookie_header = resp.headers["set-cookie"]
    assert "httponly" in cookie_header.lower()
    assert "samesite=lax" in cookie_header.lower()


async def test_register_duplicate_email_conflict(client, registered_user):
    resp = await client.post(
        REGISTER, json={"email": registered_user["email"], "password": "another-pass-1"}
    )
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "CONFLICT"


async def test_register_short_password_rejected(client):
    resp = await client.post(REGISTER, json={"email": "short@example.com", "password": "short"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_me_requires_auth(client):
    resp = await client.get(ME)
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "AUTH_REQUIRED"


async def test_me_with_session(client, registered_user):
    resp = await client.get(ME)
    assert resp.status_code == 200
    assert resp.json()["email"] == registered_user["email"]


async def test_login_success_sets_cookie(client, registered_user):
    client.cookies.clear()
    resp = await client.post(
        LOGIN, json={"email": registered_user["email"], "password": registered_user["password"]}
    )
    assert resp.status_code == 200
    assert resp.cookies


async def test_login_wrong_password_invalid_credentials(client, registered_user):
    resp = await client.post(LOGIN, json={"email": registered_user["email"], "password": "wrong-pass-1"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"


async def test_login_unknown_email_invalid_credentials(client):
    resp = await client.post(LOGIN, json={"email": "ghost@example.com", "password": "whatever-123"})
    assert resp.status_code == 401
    # Same error code as wrong password: no account enumeration
    assert resp.json()["error"]["code"] == "INVALID_CREDENTIALS"


async def test_logout_destroys_session(client, registered_user):
    resp = await client.post(LOGOUT)
    assert resp.status_code == 204
    me_after = await client.get(ME)
    assert me_after.status_code == 401


async def test_disabled_user_cannot_login(client, db_session, registered_user):
    from app.auth import service as auth_service

    user = await auth_service.get_user_by_email(db_session, registered_user["email"])
    user.status = "disabled"
    await db_session.commit()

    client.cookies.clear()
    resp = await client.post(
        LOGIN, json={"email": registered_user["email"], "password": registered_user["password"]}
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"
