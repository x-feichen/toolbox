"""Storage singleton + async dispatch helpers."""

from __future__ import annotations

import logging
from functools import lru_cache

import anyio

from app.core.config import get_settings
from app.storage.base import ObjectStorage
from app.storage.minio_storage import MinioStorage

logger = logging.getLogger(__name__)


@lru_cache
def get_storage() -> ObjectStorage:
    backend = get_settings().storage_backend
    if backend == "minio":
        return MinioStorage.from_settings()
    raise ValueError(f"unsupported storage backend: {backend}")


async def run_storage(fn, *args, **kwargs):
    """Run a blocking storage call in a worker thread."""
    if kwargs:
        from functools import partial

        return await anyio.to_thread.run_sync(partial(fn, *args, **kwargs))
    return await anyio.to_thread.run_sync(fn, *args)
