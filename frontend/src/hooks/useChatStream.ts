import { useCallback, useRef, useState } from "react";
import { ChatMessage, SSEEvent, ToolCall } from "../types/chat";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Patch the last message in state ─────────────────────────────────────
  const patchLast = useCallback((updater: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[next.length - 1] = updater({ ...next[next.length - 1] });
      return next;
    });
  }, []);

  // ── Apply one SSE event to the assistant message ─────────────────────────
  const applyEvent = useCallback(
    (event: SSEEvent) => {
      switch (event.type) {
        case "thinking":
          // already handled by showing spinner when content === '' && toolCalls === []
          break;

        case "token":
          patchLast((m) => ({ ...m, content: m.content + event.content }));
          break;

        case "tool_start": {
          const tc: ToolCall = {
            id: makeId(),
            tool: event.tool,
            input: event.input,
            status: "running",
          };
          patchLast((m) => ({ ...m, toolCalls: [...m.toolCalls, tc] }));
          break;
        }

        case "tool_end":
          patchLast((m) => ({
            ...m,
            toolCalls: m.toolCalls.map((tc) =>
              tc.status === "running"
                ? { ...tc, output: event.output, status: "done" }
                : tc,
            ),
          }));
          break;

        case "done":
          patchLast((m) => ({ ...m, isStreaming: false }));
          setIsStreaming(false);
          break;

        case "error":
          patchLast((m) => ({
            ...m,
            content: m.content || `⚠ ${event.message}`,
            isStreaming: false,
          }));
          setIsStreaming(false);
          break;
      }
    },
    [patchLast],
  );

  // ── Main send function ───────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (question: string) => {
      if (isStreaming || !question.trim()) return;

      // Snapshot history before adding new messages
      const historySnapshot = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: question.trim(),
        toolCalls: [],
        isStreaming: false,
      };
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: "",
        toolCalls: [],
        isStreaming: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_BASE}/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: question.trim(),
            history: historySnapshot,
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // SSE lines are separated by \n; events end with \n\n
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep partial line

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const event = JSON.parse(raw) as SSEEvent;
              applyEvent(event);
            } catch {
              // skip malformed JSON
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          patchLast((m) => ({
            ...m,
            content: m.content || "Connection error — please try again.",
            isStreaming: false,
          }));
          setIsStreaming(false);
        }
      }
    },
    [isStreaming, messages, applyEvent, patchLast],
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    patchLast((m) => ({ ...m, isStreaming: false }));
    setIsStreaming(false);
  }, [patchLast]);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, stopStream, clearMessages };
}
