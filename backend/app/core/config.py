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

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cookie_secure(self) -> bool:
        # Secure cookies in production; localhost development runs over http.
        return self.is_production


@lru_cache
def get_settings() -> Settings:
    return Settings()
