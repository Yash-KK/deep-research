from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from fastapi_sso.sso.google import GoogleSSO
from sqlalchemy.orm import Session

from app.config import settings
from app.core.auth import create_access_token, get_google_sso
from app.core.deps import get_current_user
from app.database import get_db
from app.models.job import ResearchJob
from app.models.user import AuthProvider, User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login")
async def login(sso: GoogleSSO = Depends(get_google_sso)):
    """Redirect the user to Google for SSO."""
    async with sso:
        return await sso.get_login_redirect(
            params={"prompt": "consent", "access_type": "offline"}
        )


@router.get("/callback")
async def callback(
    request: Request,
    db: Session = Depends(get_db),
    sso: GoogleSSO = Depends(get_google_sso),
):
    """Handle the Google redirect, upsert the user, and hand a JWT to the frontend."""
    try:
        async with sso:
            google_user = await sso.verify_and_process(request)
    except Exception:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?auth_error=true")

    if google_user is None or not google_user.id or not google_user.email:
        return RedirectResponse(f"{settings.FRONTEND_URL}/login?auth_error=true")

    user = (
        db.query(User)
        .filter(User.provider_user_id == google_user.id)
        .first()
    )
    if user is None:
        user = db.query(User).filter(User.email == google_user.email).first()

    if user is None:
        user = User(
            email=google_user.email,
            provider=AuthProvider.GOOGLE.value,
            provider_user_id=google_user.id,
            full_name=google_user.display_name or google_user.email,
            avatar_url=google_user.picture,
        )
        db.add(user)
    else:
        user.provider = AuthProvider.GOOGLE.value
        user.provider_user_id = google_user.id
        if google_user.display_name:
            user.full_name = google_user.display_name
        if google_user.picture:
            user.avatar_url = google_user.picture

    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=str(user.id))
    return RedirectResponse(f"{settings.FRONTEND_URL}/login?token={access_token}")


@router.get("/me", response_model=UserResponse)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports_used = (
        db.query(ResearchJob)
        .filter(ResearchJob.user_id == current_user.id)
        .count()
    )
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at,
        report_limit=current_user.report_limit,
        reports_used=reports_used,
    )
