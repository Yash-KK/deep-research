import json

from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest
from app.services.agents.chat_agent import get_chat_agent

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.chats_used >= current_user.chat_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Chat limit reached "
                f"({current_user.chats_used}/{current_user.chat_limit})."
            ),
        )

    current_user.chats_used += 1
    db.commit()

    messages = [
        HumanMessage(m.content) if m.role == "user" else AIMessage(m.content)
        for m in body.history
    ] + [HumanMessage(body.message)]

    async def generate():
        try:
            agent = get_chat_agent()

            async for mode, chunk in agent.astream(
                {"messages": messages}, stream_mode=["messages", "updates"]
            ):
                if mode == "messages":
                    msg, _ = chunk
                    if isinstance(msg, AIMessage) and msg.content:
                        yield {"event": "token", "data": msg.content}

                elif mode == "updates":
                    for node_output in chunk.values():
                        for m in node_output.get("messages", []):
                            if isinstance(m, AIMessage) and m.tool_calls:
                                for tc in m.tool_calls:
                                    yield {"event": "tool_start", "data": tc["name"]}
                            elif isinstance(m, ToolMessage):
                                yield {"event": "tool_end", "data": m.name}

            yield {"event": "done", "data": ""}

        except Exception as exc:
            yield {"event": "error", "data": json.dumps({"message": str(exc)})}

    return EventSourceResponse(generate())
