"""Unit tests for security primitives."""

from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)


def test_password_hash_roundtrip():
    stored = hash_password("s3cret-password")
    assert stored != "s3cret-password"
    assert stored.startswith("$argon2")


def test_password_verify_success_and_failure():
    stored = hash_password("s3cret-password")
    assert verify_password("s3cret-password", stored) is True
    assert verify_password("wrong-password", stored) is False


def test_session_token_is_high_entropy():
    tokens = {generate_session_token() for _ in range(100)}
    assert len(tokens) == 100  # no collisions
    assert all(len(t) >= 32 for t in tokens)


def test_session_token_hash_is_stable_and_irreversible():
    token = generate_session_token()
    digest = hash_session_token(token)
    assert digest == hash_session_token(token)
    assert token not in digest
    assert len(digest) == 64  # sha256 hex
