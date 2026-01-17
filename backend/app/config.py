"""Application Configuration"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "OpenQuest API"
    debug: bool = False

    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_jwt_secret: str | None = None

    # Database
    database_url: str | None = None

    # GitHub
    github_token: str | None = None

    # Redis (optional)
    redis_url: str | None = None

    @property
    def is_production(self) -> bool:
        return not self.debug


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()
