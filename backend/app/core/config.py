from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    APP_NAME: str = "LeadBolt API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api"
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]

    DATABASE_URL: str = "sqlite:///./leadbolt.db"

    CLAUDE_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20241022"
    CLAUDE_MAX_TOKENS: int = 1024
    CLAUDE_TEMPERATURE: float = 0.7
    CLAUDE_API_URL: str = "https://api.anthropic.com/v1/messages"
    CLAUDE_TIMEOUT_SECONDS: float = 30.0
    CLAUDE_RETRIES: int = 3

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_API_URL: str = (
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    )

    AI_PROVIDER: str = "auto"  # auto | claude | gemini

    TARGET_INDUSTRIES: list[str] = [
        "software",
        "saas",
        "technology",
        "it",
        "internet",
        "finance",
        "financial services",
        "healthcare",
        "insurance",
    ]


settings = Settings()
