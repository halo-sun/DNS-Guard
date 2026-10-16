from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    DATABASE_URL: str = "sqlite:///./dns_guard.db"

    SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars-long"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    OBSERVE_ONLY: bool = True
    DEFAULT_RETENTION_DAYS: int = 30
    MAX_UPLOAD_SIZE_MB: int = 10
    ENABLE_DEMO_MODE: bool = True
    ENABLE_EXTERNAL_REPUTATION: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
