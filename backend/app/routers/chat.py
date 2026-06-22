import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage

from ..core.deps import get_current_user
from ..models.user import User
from ..schemas.chat import ChatRequest
from ..services.agents.chat_agent import get_chat_agent
from ..services.search import web_search

router = APIRouter(prefix="/chat", tags=["chat"])

STREAMED_TOOL_NAMES = {web_search.name}


def _serialize_tool_input(raw) -> str:
    """Turn whatever Tavily sends as input into a readable query string."""
    if isinstance(raw, dict):
        return raw.get("query", json.dumps(raw, ensure_ascii=False))
    return str(raw)


def _serialize_tool_output(raw) -> str:
    """Summarise Tavily results into a short readable snippet."""
    if isinstance(raw, list):
        snippets = []
        for item in raw[:3]:
            if isinstance(item, dict):
                title = item.get("title", "")
                content = item.get("content", "")[:120]
                snippets.append(f"{title}: {content}".strip())
        return " · ".join(snippets) if snippets else str(raw)[:200]
    return str(raw)[:200]


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    async def generate():
        history = []
        for m in body.history:
            if m.role == "user":
                history.append(HumanMessage(content=m.content))
            else:
                history.append(AIMessage(content=m.content))

        messages = history + [HumanMessage(content=body.message)]

        yield f"data: {json.dumps({'type': 'thinking'})}\n\n"

        try:
            agent = get_chat_agent()

            async for event in agent.astream_events(
                {"messages": messages},
                version="v2",
            ):
                kind = event["event"]

                if kind == "on_tool_start":
                    tool_name = event.get("name", "")
                    if tool_name not in STREAMED_TOOL_NAMES:
                        continue

                    raw_input = event.get("data", {}).get("input", {})
                    payload = {
                        "type": "tool_start",
                        "tool": tool_name,
                        "input": _serialize_tool_input(raw_input),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"

                elif kind == "on_tool_end":
                    tool_name = event.get("name", "")
                    if tool_name not in STREAMED_TOOL_NAMES:
                        continue

                    raw_output = event.get("data", {}).get("output", "")
                    payload = {
                        "type": "tool_end",
                        "tool": tool_name,
                        "output": _serialize_tool_output(raw_output),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"

                elif kind == "on_chat_model_stream":
                    chunk = event.get("data", {}).get("chunk")
                    if not chunk:
                        continue

                    content = getattr(chunk, "content", "")

                    if isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict) and block.get("type") == "text":
                                text = block.get("text", "")
                                if text:
                                    yield f"data: {json.dumps({'type': 'token', 'content': text})}\n\n"

                    elif isinstance(content, str) and content:
                        yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as exc:
            payload = {"type": "error", "message": str(exc)}
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection":    "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
