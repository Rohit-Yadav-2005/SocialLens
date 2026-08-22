"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "SocialLens API"
    api_v1_prefix: str = "/api/v1"
    environment: str = "development"

    database_url: str = f"sqlite:///{BACKEND_ROOT / 'socialens.db'}"

    cors_origins: str = "http://localhost:3000"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    max_upload_size_mb: int = 20
    temp_dir: Path = BACKEND_ROOT / "temp"

    tesseract_cmd: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
