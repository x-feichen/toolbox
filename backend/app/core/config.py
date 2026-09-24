"""Application configuration.

All settings come from environment variables (12-factor). Secrets must never
be committed to version control; see `.env.example` at the repo root.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"

    database_url: str = "postgresql+asyncpg://toolbox:toolbox@localhost:5432/toolbox"
    session_secret: str = "dev-secret-change-me"
    cors_origins: str = "http://localhost:3000"

    session_lifetime_days: int = 14
    session_cookie_name: str = "toolbox_session"

    # Comma-separated allowlist: registrations with these emails get the
    # admin role (e.g. ADMIN_EMAILS=ops@example.com,cto@example.com).
    admin_emails: str = ""

    # Object storage for user assets (avatars). "minio" runs against an
    # S3-compatible server; the bucket stays private and the backend proxies
    # reads, so MinIO itself is never exposed publicly.
    storage_backend: str = "minio"
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "avatars"
    minio_secure: bool = False

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def admin_email_list(self) -> list[str]:
        return [email.strip().lower() for email in self.admin_emails.split(",") if email.strip()]

    def is_admin_email(self, email: str) -> bool:
        return email.lower() in self.admin_email_list

    @property
    def cookie_secure(self) -> bool:
        # Secure cookies in production; localhost development runs over http.
        return self.is_production


@lru_cache
def get_settings() -> Settings:
    return Settings()
