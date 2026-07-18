import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")


def _getenv(name: str, default: str = "", *, required: bool = False) -> str:
    raw = os.getenv(name, default if default else None)
    if raw is None:
        if required:
            raise ValueError(f"Missing required environment variable: {name}")
        return ""
    value = raw.strip().strip("'\"")
    if required and not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


class Settings:
    DATABASE_URL: str = _getenv("DATABASE_URL", required=True)
    REDIS_URL: str = _getenv("REDIS_URL", required=True)
    SECRET_KEY: str = _getenv("SECRET_KEY", required=True)
    ALGORITHM: str = _getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(_getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    NVIDIA_QWEN_MODEL: str = _getenv("NVIDIA_QWEN_MODEL")
    NVIDIA_API_KEY: str = _getenv("NVIDIA_API_KEY")
    NVIDIA_BASE_URL: str = _getenv("NVIDIA_BASE_URL")
    TAVILY_API_KEY: str = _getenv("TAVILY_API_KEY")
    TAVILY_USAGE_URL: str = _getenv("TAVILY_USAGE_URL")
    WEATHER_API_URL: str = _getenv("WEATHER_API_URL")

    GOOGLE_CLIENT_ID: str = _getenv("GOOGLE_CLIENT_ID", required=True)
    GOOGLE_CLIENT_SECRET: str = _getenv("GOOGLE_CLIENT_SECRET", required=True)
    GOOGLE_REDIRECT_URI: str = _getenv("GOOGLE_REDIRECT_URI", required=True)
    FRONTEND_URL: str = _getenv("FRONTEND_URL", "http://localhost:5173")
    ALLOW_INSECURE_HTTP: bool = _getenv("ALLOW_INSECURE_HTTP", "true").lower() in (
        "1",
        "true",
        "yes",
    )

    CORS_ORIGINS: str = _getenv("CORS_ORIGINS")


settings = Settings()
