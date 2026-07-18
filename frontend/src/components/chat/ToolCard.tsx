import { Globe, Loader2 } from "lucide-react";
import { ToolCall } from "../../types/chat";

interface Props {
  tc: ToolCall;
}

const TOOL_LABELS: Record<string, string> = {
  tavily_search_results_json: "Web Search",
  TavilySearchResults: "Web Search",
  web_search: "Web Search",
  calculator: "Calculator",
  weather: "Weather",
};

function label(tool: string) {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, " ");
}

export default function ToolCallCard({ tc }: Props) {
  const running = tc.status === "running";

  return (
    <div
      className={`my-1.5 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
        running
          ? "border-violet-200 bg-violet-50/60"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      {running ? (
        <Loader2
          size={12}
          className="text-violet-500 animate-spin flex-shrink-0"
        />
      ) : (
        <Globe size={12} className="text-emerald-500 flex-shrink-0" />
      )}

      <span
        className={`font-semibold ${running ? "text-violet-700" : "text-gray-600"}`}
      >
        {running ? `Using ${label(tc.tool)}…` : `✓ ${label(tc.tool)}`}
      </span>
    </div>
  );
}
