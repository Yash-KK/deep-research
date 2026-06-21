from google.auth.transport import requests
from google.oauth2 import id_token

from ..config import settings


def verify_google_token(token: str):
    return id_token.verify_oauth2_token(
        token,
        requests.Request(),
        settings.GOOGLE_CLIENT_ID,
    )