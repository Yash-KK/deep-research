import { ChevronDown, ChevronRight, Globe, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolCall } from "../../types/chat";

interface Props {
  tc: ToolCall;
}

const TOOL_LABELS: Record<string, string> = {
  tavily_search_results_json: "Web Search",
  TavilySearchResults: "Web Search",
  web_search: "Web Search",
};

function label(tool: string) {
  return TOOL_LABELS[tool] ?? tool.replace(/_/g, " ");
}

export default function ToolCallCard({ tc }: Props) {
  const [open, setOpen] = useState(false);
  const running = tc.status === "running";

  return (
    <div
      className={`my-1.5 rounded-xl border text-xs overflow-hidden transition-colors ${
        running
          ? "border-violet-200 bg-violet-50/60"
          : "border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300"
      }`}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 text-left select-none"
        onClick={() => !running && setOpen((o) => !o)}
        disabled={running}
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
          className={`font-semibold flex-shrink-0 ${running ? "text-violet-700" : "text-gray-600"}`}
        >
          {running ? `Searching…` : `✓ ${label(tc.tool)}`}
        </span>

        <span className="text-gray-400 truncate flex-1 font-normal">
          {tc.input}
        </span>

        {!running &&
          (open ? (
            <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
          ))}
      </button>

      {/* Collapsible output */}
      {open && tc.output && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-200">
          <p className="text-gray-500 leading-relaxed">{tc.output}</p>
        </div>
      )}
    </div>
  );
}
