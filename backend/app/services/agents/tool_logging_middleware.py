import json
import logging
from typing import Any, Awaitable, Callable

from langchain.agents.middleware.types import AgentMiddleware
from langgraph.prebuilt.tool_node import ToolCallRequest
from langgraph.types import Command
from langchain_core.messages import ToolMessage

logger = logging.getLogger("app.deepagent")


def _serialize_for_log(value: Any, max_chars: int | None = None) -> str:
    try:
        serialized = json.dumps(value, default=str, ensure_ascii=False)
    except TypeError:
        serialized = str(value)
    if max_chars is not None and len(serialized) > max_chars:
        return serialized[:max_chars] + "..."
    return serialized


class DeepAgentToolLoggingMiddleware(AgentMiddleware):
    """Log DeepAgent tool inputs and outputs for each research job."""

    def __init__(self, job_id: str, question: str) -> None:
        super().__init__()
        self.job_id = job_id
        self.question = question

    async def abefore_agent(self, state, runtime):
        logger.info(
            "DeepAgent run start | job_id=%s | question=%s",
            self.job_id,
            self.question,
        )
        return None

    async def aafter_agent(self, state, runtime):
        logger.info("DeepAgent run end | job_id=%s", self.job_id)
        return None

    async def awrap_tool_call(
        self,
        request: ToolCallRequest,
        handler: Callable[[ToolCallRequest], Awaitable[ToolMessage | Command[Any]]],
    ) -> ToolMessage | Command[Any]:
        tool_call = request.tool_call or {}
        tool_name = tool_call.get("name", "unknown")
        tool_id = tool_call.get("id", "")
        tool_input = tool_call.get("args", {})

        logger.info(
            "DeepAgent tool call start | job_id=%s | tool=%s | call_id=%s | input=%s",
            self.job_id,
            tool_name,
            tool_id,
            _serialize_for_log(tool_input),
        )

        try:
            result = await handler(request)
        except Exception:
            logger.exception(
                "DeepAgent tool call failed | job_id=%s | tool=%s | call_id=%s",
                self.job_id,
                tool_name,
                tool_id,
            )
            raise

        if isinstance(result, ToolMessage):
            output = result.content
        else:
            output = result

        logger.info(
            "DeepAgent tool call end | job_id=%s | tool=%s | call_id=%s | output=%s",
            self.job_id,
            tool_name,
            tool_id,
            _serialize_for_log(output, max_chars=100),
        )
        return result
