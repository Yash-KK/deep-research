import { Loader2, Send, Square, Trash2, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatStream } from "../hooks/useChatStream";
import ToolCallCard from "./chat/ToolCard";

interface Props {
  onClose: () => void;
}

function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const isBullet = /^[-*•]\s/.test(line);
    const processed = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gray-200 text-violet-800 px-1 rounded text-xs font-mono">$1</code>',
      )
      .replace(/^[-*•]\s/, "");

    if (isBullet) {
      elements.push(
        <li
          key={i}
          className="ml-4 list-disc"
          dangerouslySetInnerHTML={{ __html: processed }}
        />,
      );
    } else if (processed.trim()) {
      elements.push(
        <p
          key={i}
          className="mb-1"
          dangerouslySetInnerHTML={{ __html: processed }}
        />,
      );
    } else {
      elements.push(<br key={i} />);
    }
  });

  return (
    <div className="text-sm leading-relaxed text-gray-800">{elements}</div>
  );
}

export default function ChatPanel({ onClose }: Props) {
  const { messages, isStreaming, sendMessage, stopStream, clearMessages } =
    useChatStream();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || isStreaming) return;
    setInput("");
    sendMessage(q);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-[600px] h-[620px] flex flex-col rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 bg-navy-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
            <Zap size={13} className="text-white" />
          </div>
          <div>
            <span className="text-white text-sm font-semibold">
              Quick Search
            </span>
            <span className="text-slate-400 text-xs ml-2">
              web agent · live
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Clear history"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8 select-none">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
              <Zap size={22} className="text-violet-600" />
            </div>
            <p className="text-gray-700 font-medium text-sm mb-2">
              Available Tools
            </p>

            <div className="space-y-2 text-xs max-w-[280px]">
              <div className="flex items-center gap-2 text-gray-600">
                🌦️{" "}
                <span>
                  <strong>WeatherAI</strong> — Live weather & forecasts
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                🧮{" "}
                <span>
                  <strong>Calculator</strong> — Solve math expressions instantly
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                🔍{" "}
                <span>
                  <strong>WebSearch</strong> — Search the latest information &
                  news
                </span>
              </div>
            </div>

            <p className="text-gray-400 text-xs mt-4 max-w-[260px] leading-relaxed">
              Try asking a question that uses multiple tools in one request.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {[
                "What's the weather in Mumbai? Also calculate 4*56 and 3-90, and give me the latest news on HDFC.",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-gray-100 hover:bg-violet-50 hover:text-violet-700 text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 hover:border-violet-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const hasRunningTools = msg.toolCalls.some(
            (tc) => tc.status === "running",
          );
          const showThinking =
            msg.role === "assistant" &&
            msg.isStreaming &&
            msg.content === "" &&
            !hasRunningTools;

          return (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="max-w-[82%] bg-violet-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[92%] space-y-1">
                {msg.toolCalls.map((tc) => (
                  <ToolCallCard key={tc.id} tc={tc} />
                ))}

                {showThinking && (
                  <div className="flex items-center gap-2 text-violet-500 text-xs py-1.5 px-1">
                    <Loader2 size={13} className="animate-spin" />
                    <span>Thinking…</span>
                  </div>
                )}

                {msg.content !== "" && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    {renderContent(msg.content)}
                    {msg.isStreaming && (
                      <span className="inline-block w-0.5 h-4 bg-violet-500 animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-violet-300 focus-within:ring-1 focus-within:ring-violet-200 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question…"
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none leading-relaxed disabled:opacity-50 min-h-[24px] max-h-[120px]"
          />

          {isStreaming ? (
            <button
              onClick={stopStream}
              className="p-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-white transition-colors flex-shrink-0 mb-0.5"
              title="Stop"
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white transition-colors flex-shrink-0 mb-0.5"
              title="Send"
            >
              <Send size={13} />
            </button>
          )}
        </div>
        {isStreaming ? (
          <p className="text-center text-violet-500 text-xs mt-1.5 flex items-center justify-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            <span>Agent is thinking…</span>
          </p>
        ) : (
          <p className="text-center text-gray-400 text-xs mt-1.5">
            <kbd className="font-mono bg-gray-100 px-1 rounded">Enter</kbd> send ·{" "}
            <kbd className="font-mono bg-gray-100 px-1 rounded">Shift+Enter</kbd>{" "}
            new line
          </p>
        )}
      </div>
    </div>
  );
}
