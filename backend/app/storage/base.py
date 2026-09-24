"""Object storage abstraction.

The Protocol is intentionally synchronous (the MinIO SDK is sync); callers in
async request handlers dispatch to a thread via `run_storage` so the event
loop is never blocked. The interface is storage-agnostic — a local-disk or
S3 implementation can be added later without touching consumers.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class StorageError(Exception):
    """Raised when the storage backend fails (connection, permissions, ...)."""


class ObjectNotFound(StorageError):
    def __init__(self, key: str) -> None:
        super().__init__(f"object not found: {key}")
        self.key = key


@dataclass(frozen=True)
class StoredObject:
    data: bytes
    content_type: str
    etag: str | None = None


class ObjectStorage(Protocol):
    def ensure_ready(self) -> None:
        """Idempotently prepare the backend (create bucket if missing)."""

    def put_object(self, key: str, data: bytes, content_type: str) -> None: ...

    def get_object(self, key: str) -> StoredObject: ...

    def delete_object(self, key: str) -> None:
        """Delete if present; must not fail when the key is already gone."""

    def object_exists(self, key: str) -> bool: ...
