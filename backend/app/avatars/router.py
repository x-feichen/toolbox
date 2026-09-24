"""Avatar routes.

Upload (authenticated) stores the image in object storage and points
`users.avatar_url` at a same-origin API path. Reads are unauthenticated
(gravatar-style) so avatars render on publicly shared pages; the bucket
itself stays private and is never exposed.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_current_user
from app.auth.models import User
from app.auth.schemas import UserOut
from app.core.database import get_db
from app.core.errors import AppError, ErrorCode
from app.storage.base import ObjectNotFound, StorageError
from app.storage.factory import get_storage, run_storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/avatars", tags=["avatars"])

MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2 MB after client-side compression
ALLOWED_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
AVATAR_PATH_PREFIX = "/api/v1/avatars/"


def _key_from_avatar_url(avatar_url: str | None) -> str | None:
    """Extract the storage key from a stored avatar URL (ours only)."""
    if not avatar_url or not avatar_url.startswith(AVATAR_PATH_PREFIX):
        return None
    return avatar_url[len(AVATAR_PATH_PREFIX) :]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    if file.content_type not in ALLOWED_TYPES:
        raise AppError(
            ErrorCode.VALIDATION_ERROR,
            "仅支持 JPG / PNG / WebP 图片",
            status_code=415,
        )

    data = await file.read()
    if len(data) > MAX_AVATAR_BYTES:
        raise AppError(
            ErrorCode.VALIDATION_ERROR,
            "图片过大（最大 2MB）",
            status_code=413,
        )
    if not data:
        raise AppError(ErrorCode.VALIDATION_ERROR, "图片内容为空", status_code=400)

    extension = ALLOWED_TYPES[file.content_type]
    key = f"avatars/{user.id}/{uuid.uuid4()}.{extension}"
    storage = get_storage()

    try:
        await run_storage(storage.put_object, key, data, file.content_type)
    except StorageError as exc:
        logger.error("avatar upload failed: %s", exc)
        raise AppError(
            ErrorCode.INTERNAL_ERROR, "图片存储失败，请稍后重试", status_code=502
        ) from exc

    # Replace: drop the previous file when it was stored by us.
    old_key = _key_from_avatar_url(user.avatar_url)
    if old_key:
        try:
            await run_storage(storage.delete_object, old_key)
        except StorageError:
            logger.warning("failed to remove old avatar: %s", old_key)

    user.avatar_url = f"{AVATAR_PATH_PREFIX}{key}"
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/{key:path}")
async def get_avatar(key: str) -> Response:
    """Public read (same-origin proxy over the private bucket)."""
    storage = get_storage()
    try:
        stored = await run_storage(storage.get_object, key)
    except ObjectNotFound:
        raise AppError(ErrorCode.NOT_FOUND, "头像不存在", status_code=404) from None
    except StorageError as exc:
        raise AppError(
            ErrorCode.INTERNAL_ERROR, "图片读取失败", status_code=502
        ) from exc

    headers = {
        # Keys contain a uuid, so the content is immutable → cache forever.
        "Cache-Control": "public, max-age=31536000, immutable",
    }
    if stored.etag:
        headers["ETag"] = f'"{stored.etag}"'
    return Response(content=stored.data, media_type=stored.content_type, headers=headers)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar(
    user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    key = _key_from_avatar_url(user.avatar_url)
    if key:
        try:
            await run_storage(get_storage().delete_object, key)
        except StorageError as exc:
            logger.warning("failed to delete avatar %s: %s", key, exc)
    user.avatar_url = None
    await db.commit()
