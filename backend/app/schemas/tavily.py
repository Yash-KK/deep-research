from pydantic import BaseModel


class TavilyUsageResponse(BaseModel):
    used: int
    limit: int | None
    plan: str
    search_usage: int
