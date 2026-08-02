import os
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

# `.env` lives at the repo root, one level above the `backend/` package.
# Resolve it from this file (not the process CWD) so the Postgres
# DATABASE_URL is picked up regardless of where uvicorn is launched from.
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    # App
    app_name: str = "Leadbolt API"
    app_env: str = "development"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # Database
    database_url: str = "sqlite:///./leadbolt.db"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # API
    api_prefix: str = "/api/v1"

    # LLM Providers
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openrouter_api_key: str = ""

    class Config:
        env_file = str(_ENV_FILE)
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()