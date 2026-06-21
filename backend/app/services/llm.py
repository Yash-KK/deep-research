from langchain_openai import ChatOpenAI

from ..config import settings


def get_llm_model() -> ChatOpenAI:
    if not settings.NVIDIA_API_KEY or not settings.NVIDIA_BASE_URL or not settings.NVIDIA_QWEN_MODEL:
        raise ValueError(
            "NVIDIA settings missing. Set NVIDIA_API_KEY, NVIDIA_BASE_URL, and NVIDIA_QWEN_MODEL in .env"
        )

    return ChatOpenAI(
        model=settings.NVIDIA_QWEN_MODEL,
        api_key=settings.NVIDIA_API_KEY,
        base_url=settings.NVIDIA_BASE_URL,
    )
