"""MinIO (S3-compatible) implementation of ObjectStorage."""

from __future__ import annotations

import io
import logging
import time

from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings
from app.storage.base import ObjectNotFound, StorageError, StoredObject

logger = logging.getLogger(__name__)


class MinioStorage:
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        bucket: str,
        secure: bool = False,
    ) -> None:
        self.bucket = bucket
        self._client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)

    @classmethod
    def from_settings(cls) -> "MinioStorage":
        settings = get_settings()
        return cls(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            bucket=settings.minio_bucket,
            secure=settings.minio_secure,
        )

    def ensure_ready(self, *, attempts: int = 10, delay: float = 3.0) -> None:
        """Create the private bucket if missing; retry while MinIO boots."""
        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            try:
                if not self._client.bucket_exists(self.bucket):
                    self._client.make_bucket(self.bucket)
                    logger.info("created bucket %s", self.bucket)
                return
            except S3Error as exc:  # pragma: no cover - depends on server state
                last_error = exc
                logger.warning("storage not ready (attempt %d/%d): %s", attempt, attempts, exc)
                time.sleep(delay)
        raise StorageError(f"object storage unavailable: {last_error}")

    def put_object(self, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            self.bucket,
            key,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )

    def get_object(self, key: str) -> StoredObject:
        try:
            response = self._client.get_object(self.bucket, key)
        except S3Error as exc:
            if exc.code in {"NoSuchKey", "NoSuchObject"}:
                raise ObjectNotFound(key) from exc
            raise StorageError(str(exc)) from exc
        try:
            data = response.read()
            return StoredObject(
                data=data,
                content_type=response.headers.get("Content-Type", "application/octet-stream"),
                etag=(response.headers.get("ETag") or "").strip('"') or None,
            )
        finally:
            response.close()
            response.release_conn()

    def delete_object(self, key: str) -> None:
        # S3 DELETE is idempotent — no error when the object is absent.
        self._client.remove_object(self.bucket, key)

    def object_exists(self, key: str) -> bool:
        try:
            self._client.stat_object(self.bucket, key)
            return True
        except S3Error as exc:
            if exc.code in {"NoSuchKey", "NoSuchObject"}:
                return False
            raise StorageError(str(exc)) from exc
