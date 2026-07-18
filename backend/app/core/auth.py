from datetime import datetime, timedelta, timezone
from functools import lru_cache

import jwt
from fastapi_sso.sso.google import GoogleSSO

from ..config import settings


@lru_cache
def get_google_sso() -> GoogleSSO:
    """Cached Google SSO client built from application settings."""
    return GoogleSSO(
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
        allow_insecure_http=settings.ALLOW_INSECURE_HTTP,
    )


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    """Sign a JWT for an authenticated user (subject is the user id)."""
    now = datetime.now(timezone.utc)
    expire = now + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": subject, "iat": now, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT, raising jwt.InvalidTokenError on failure."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
