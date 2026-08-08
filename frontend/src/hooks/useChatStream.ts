import { useCallback, useRef, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { ChatMessage, ToolCall } from "../types/chat";

const API_BASE = import.meta.env.VITE_API_URL;

function makeId() {
  return Math.random().toString(36).slice(2);
}

interface UseChatStreamOptions {
  limitReached?: boolean;
  onChatUsed?: () => void;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const { limitReached = false, onChatUsed } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const onChatUsedRef = useRef(onChatUsed);
  onChatUsedRef.current = onChatUsed;

  const patchLast = useCallback((updater: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[next.length - 1] = updater({ ...next[next.length - 1] });
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (question: string) => {
      if (isStreaming || !question.trim() || limitReached) return;

      const historySnapshot = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "user",
          content: question.trim(),
          toolCalls: [],
          isStreaming: false,
        },
        {
          id: makeId(),
          role: "assistant",
          content: "",
          toolCalls: [],
          isStreaming: true,
        },
      ]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const token = sessionStorage.getItem("access_token");

      try {
        await fetchEventSource(`${API_BASE}/chat/stream`, {
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

          async onopen(response) {
            if (response.status === 403) {
              throw new Error("CHAT_LIMIT");
            }
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            onChatUsedRef.current?.();
          },

          onmessage(ev) {
            switch (ev.event) {
              case "token":
                patchLast((m) => ({ ...m, content: m.content + ev.data }));
                break;

              case "tool_start":
                patchLast((m) => ({
                  ...m,
                  toolCalls: [
                    ...m.toolCalls,
                    {
                      id: makeId(),
                      tool: ev.data,
                      status: "running",
                    } as ToolCall,
                  ],
                }));
                break;

              case "tool_end":
                patchLast((m) => ({
                  ...m,
                  toolCalls: m.toolCalls.map((tc) =>
                    tc.tool === ev.data && tc.status === "running"
                      ? { ...tc, status: "done" }
                      : tc,
                  ),
                }));
                break;

              case "done":
              case "error":
                patchLast((m) => ({
                  ...m,
                  content:
                    m.content ||
                    (ev.event === "error"
                      ? "⚠ Something went wrong."
                      : m.content),
                  isStreaming: false,
                }));
                setIsStreaming(false);
                break;
            }
          },

          onerror(err) {
            patchLast((m) => ({
              ...m,
              content:
                err instanceof Error && err.message === "CHAT_LIMIT"
                  ? "Chat limit reached."
                  : m.content || "Connection error — please try again.",
              isStreaming: false,
            }));
            setIsStreaming(false);
            throw err;
          },

          onclose() {
            setIsStreaming(false);
          },
        });
      } catch {
        // onerror already handled it
      }
    },
    [isStreaming, limitReached, messages, patchLast],
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
