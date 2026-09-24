"""In-memory ObjectStorage for tests (records operations)."""

from __future__ import annotations

from app.storage.base import ObjectNotFound, StoredObject


class InMemoryStorage:
    def __init__(self) -> None:
        self.objects: dict[str, StoredObject] = {}
        self.put_calls: list[str] = []
        self.delete_calls: list[str] = []

    def ensure_ready(self) -> None:
        return None

    def put_object(self, key: str, data: bytes, content_type: str) -> None:
        self.put_calls.append(key)
        self.objects[key] = StoredObject(data=data, content_type=content_type, etag="fake-etag")

    def get_object(self, key: str) -> StoredObject:
        if key not in self.objects:
            raise ObjectNotFound(key)
        return self.objects[key]

    def delete_object(self, key: str) -> None:
        self.delete_calls.append(key)
        self.objects.pop(key, None)

    def object_exists(self, key: str) -> bool:
        return key in self.objects
