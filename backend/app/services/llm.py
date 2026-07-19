from langchain_openai import ChatOpenAI

from ..config import settings


def get_llm_model() -> ChatOpenAI:
    if not settings.AIC_API_KEY or not settings.AIC_BASE_URL or not settings.AIC_META_8_MODEL:
        raise ValueError(
            "AIC settings missing. Set AIC_API_KEY, AIC_BASE_URL, and AIC_META_8_MODEL in .env"
        )

    return ChatOpenAI(
        model=settings.AIC_META_8_MODEL,
        api_key=settings.AIC_API_KEY,
        base_url=settings.AIC_BASE_URL,
    )
