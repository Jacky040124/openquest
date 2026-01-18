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
    supabase_url: str | None = None
    supabase_key: str | None = None
    supabase_jwt_secret: str | None = None

    # Database
    database_url: str | None = None

    # GitHub
    github_token: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None
    github_redirect_uri: str | None = None

    # Redis (optional)
    redis_url: str | None = None

    # OpenRouter LLM
    openrouter_api_key: str | None = None
    openrouter_model: str = "anthropic/claude-3.5-haiku"

    # E2B
    e2b_api_key: str | None = None

    # Agent Configuration
    agent_max_turns: int = 25
    agent_max_tokens_per_tool: int = 8000

    @property
    def is_production(self) -> bool:
        return not self.debug


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()
