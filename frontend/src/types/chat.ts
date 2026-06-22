export type ChatRole = "user" | "assistant";

export interface ToolCall {
  id: string;
  tool: string;
  input: string;
  output?: string;
  status: "running" | "done";
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  toolCalls: ToolCall[];
  isStreaming: boolean;
}

// SSE event shapes coming from the backend
export type SSEEvent =
  | { type: "thinking" }
  | { type: "token"; content: string }
  | { type: "tool_start"; tool: string; input: string }
  | { type: "tool_end"; tool: string; output: string }
  | { type: "done" }
  | { type: "error"; message: string };
