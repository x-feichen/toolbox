"""Tests for admin user management + admin role assignment."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.auth import service as auth_service

ADMIN_USERS = "/api/v1/admin/users"
CHANGE_PW = "/api/v1/auth/me/password"


async def _make_admin(client: AsyncClient, db_session, email: str) -> dict:
    """Register a user and promote them to admin directly in the DB."""
    payload = {"email": email, "password": "admin-password-1"}
    await client.post("/api/v1/auth/register", json=payload)
    user = await auth_service.get_user_by_email(db_session, email)
    user.role = "admin"
    await db_session.commit()
    return payload


async def test_admin_emails_allowlist_grants_admin_role(client, db_session, monkeypatch):
    from app.core import config as config_module

    settings = config_module.get_settings()
    monkeypatch.setattr(settings, "admin_emails", "Boss@Example.com, ops@example.com")

    client.cookies.clear()
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "boss@example.com", "password": "password-123"},
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "admin"

    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "random@example.com", "password": "password-123"},
    )
    assert resp.json()["role"] == "user"


async def test_admin_routes_require_authentication(client):
    resp = await client.get(ADMIN_USERS)
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "AUTH_REQUIRED"


async def test_admin_routes_forbid_normal_user(client, registered_user):
    resp = await client.get(ADMIN_USERS)
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "FORBIDDEN"


async def test_admin_can_list_users(client, db_session, registered_user, second_user):
    admin = await _make_admin(client, db_session, "root@example.com")

    resp = await client.get(ADMIN_USERS)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3  # alice, bob, root
    emails = {u["email"] for u in body["items"]}
    assert emails == {"alice@example.com", "bob@example.com", "root@example.com"}


async def test_user_list_search_filter_pagination(client, db_session, registered_user, second_user):
    await _make_admin(client, db_session, "root@example.com")

    by_search = (await client.get(ADMIN_USERS, params={"q": "bob"})).json()
    assert [u["email"] for u in by_search["items"]] == ["bob@example.com"]

    by_role = (await client.get(ADMIN_USERS, params={"role": "admin"})).json()
    assert by_role["total"] == 1
    assert by_role["items"][0]["email"] == "root@example.com"

    page = (await client.get(ADMIN_USERS, params={"page": 1, "page_size": 2})).json()
    assert len(page["items"]) == 2
    assert page["total"] == 3
    assert page["page"] == 1


async def test_change_password_requires_correct_current_password(client, registered_user):
    resp = await client.post(
        CHANGE_PW, json={"current_password": "wrong", "new_password": "brand-new-pass-1"}
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_change_password_signs_out_other_devices(client, db_session, registered_user):
    # create a second session (another device) for the same user
    other = await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert other.status_code == 200

    resp = await client.post(
        CHANGE_PW,
        json={
            "current_password": registered_user["password"],
            "new_password": "brand-new-pass-1",
        },
    )
    assert resp.status_code == 204

    # current session survives
    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 200

    # old password no longer works, new one does
    bad = await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert bad.status_code == 401

    client.cookies.clear()
    good = await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": "brand-new-pass-1"},
    )
    assert good.status_code == 200


async def test_admin_reset_password_invalidates_all_sessions(client, db_session, registered_user):
    admin = await _make_admin(client, db_session, "root@example.com")

    # look up alice's id, then act as admin
    client.cookies.clear()
    await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    user_id = (await client.get("/api/v1/auth/me")).json()["id"]

    client.cookies.clear()
    await client.post("/api/v1/auth/login", json={"email": admin["email"], "password": admin["password"]})

    resp = await client.post(f"{ADMIN_USERS}/{user_id}/password", json={"new_password": "reset-pass-99"})
    assert resp.status_code == 204

    # all of the target's sessions are gone: the old password no longer logs in
    client.cookies.clear()
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": "reset-pass-99"},
    )
    assert new_login.status_code == 200


async def test_admin_cannot_modify_own_role_or_status(client, db_session):
    await _make_admin(client, db_session, "root@example.com")
    me = (await client.get("/api/v1/auth/me")).json()

    demote = await client.patch(f"{ADMIN_USERS}/{me['id']}", json={"role": "user"})
    assert demote.status_code == 400

    disable = await client.patch(f"{ADMIN_USERS}/{me['id']}", json={"status": "disabled"})
    assert disable.status_code == 400


async def test_last_active_admin_is_protected_at_service_level(db_session, client, registered_user):
    """Defense in depth: the guard also fires for non-API call paths
    (future CLI/jobs). The API layer itself makes it unreachable because the
    only remaining admin cannot modify themselves."""
    from app.admin import service as admin_service
    from app.core.errors import AppError

    # root is the only active admin
    root = await auth_service.register_user(db_session, email="root@example.com", password="pw-12345678")
    root.role = "admin"
    root.status = "active"
    await db_session.commit()

    # a non-self actor (any caller path) cannot demote or disable the last admin
    actor = await auth_service.get_user_by_email(db_session, registered_user["email"])

    with pytest.raises(AppError) as exc:
        await admin_service.update_user(
            db_session, actor=actor, target_id=root.id, role="user", status=None
        )
    assert "最后一个管理员" in exc.value.message

    with pytest.raises(AppError):
        await admin_service.update_user(
            db_session, actor=actor, target_id=root.id, role=None, status="disabled"
        )


async def test_disabled_user_cannot_use_admin_api(client, db_session, registered_user, second_user):
    await _make_admin(client, db_session, "root@example.com")
    users = (await client.get(ADMIN_USERS)).json()["items"]
    bob = next(u for u in users if u["email"] == "bob@example.com")

    await client.patch(f"{ADMIN_USERS}/{bob['id']}", json={"status": "disabled"})

    client.cookies.clear()
    login = await client.post(
        "/api/v1/auth/login", json={"email": "bob@example.com", "password": second_user["password"]}
    )
    assert login.status_code == 403  # disabled at login
