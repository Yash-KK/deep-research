import requests
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.tavily import TavilyUsageResponse
from app.services.tavily_usage import fetch_tavily_usage

router = APIRouter(prefix="/tavily", tags=["tavily"])


@router.get("/usage", response_model=TavilyUsageResponse)
def get_tavily_usage(_current_user: User = Depends(get_current_user)):
    try:
        data = fetch_tavily_usage()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except requests.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch Tavily usage",
        ) from exc
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Tavily usage service unavailable",
        ) from exc

    account = data.get("account", {})
    return TavilyUsageResponse(
        used=account.get("plan_usage", 0),
        limit=account.get("plan_limit"),
        plan=account.get("current_plan", "Unknown"),
        search_usage=account.get("search_usage", 0),
    )
