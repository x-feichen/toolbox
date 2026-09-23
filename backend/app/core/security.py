"""Password hashing and session token primitives.

- Passwords: Argon2id via pwdlib (never store plaintext).
- Session tokens: high-entropy random tokens; only their SHA-256 hash is
  persisted so a database leak cannot be replayed as valid cookies.
"""

from __future__ import annotations

import hashlib
import secrets

from pwdlib import PasswordHash

_password_hasher = PasswordHash.recommended()

SESSION_TOKEN_BYTES = 32


def hash_password(plain: str) -> str:
    return _password_hasher.hash(plain)


def verify_password(plain: str, password_hash: str) -> bool:
    return _password_hasher.verify(plain, password_hash)


def generate_session_token() -> str:
    return secrets.token_urlsafe(SESSION_TOKEN_BYTES)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
