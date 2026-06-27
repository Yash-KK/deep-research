from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.config import settings
from app.core.auth import authenticate_user, create_access_token, get_password_hash
from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, LoginRequest, Token, UserCreate, UserResponse
from app.services.google_auth import verify_google_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google")
def google_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    try:
        google_user = verify_google_token(payload.token)

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token",
        )

    email = google_user["email"]

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        user = User(
            email=email,
            full_name=google_user.get("name"),
            provider="google",
            provider_user_id=google_user["sub"],
            avatar_url=google_user.get("picture"),
        )

        db.add(user)
        db.commit()
        db.refresh(user)

    return _login_response(user)


@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _login_response(user: User) -> Token:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer", user=user)


@router.post("/token", response_model=Token)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _login_response(user)


@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _login_response(user)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user
