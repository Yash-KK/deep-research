import { format } from "date-fns";
import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { ResearchJob } from "../types";
import {
  downloadReportDocx,
  downloadReportMarkdown,
} from "../utils/downloadResearchReport";
import MarkdownContent from "./MarkdownContent";
import StatusBadge from "./StatusBadge";

interface Props {
  job: ResearchJob | null;
  onClose: () => void;
}

export default function JobDetailModal({ job, onClose }: Props) {
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownloadDocx = async (researchJob: ResearchJob) => {
    setDownloadingDocx(true);
    try {
      await downloadReportDocx(researchJob);
    } catch {
      toast.error("Failed to generate Word document");
    } finally {
      setDownloadingDocx(false);
    }
  };

  if (!job) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={job.status} />
              <span className="text-xs text-gray-400">
                {format(new Date(job.created_at), "PPp")}
              </span>
            </div>
            <h2 className="text-gray-900 font-semibold text-base leading-snug">
              {job.question}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {job.status === "completed" && job.result && (
              <>
                <button
                  onClick={() => downloadReportMarkdown(job)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <Download size={13} />
                  Download .md
                </button>
                <button
                  onClick={() => handleDownloadDocx(job)}
                  disabled={downloadingDocx}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-lg transition-colors"
                >
                  <Download size={13} />
                  {downloadingDocx ? "Generating…" : "Download .docx"}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {job.status === "completed" && job.result ? (
            <MarkdownContent content={job.result} />
          ) : job.status === "failed" ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm font-medium mb-1">
                Research failed
              </p>
              <p className="text-red-600 text-sm font-mono whitespace-pre-wrap">
                {job.error}
              </p>
            </div>
          ) : job.status === "cancelled" ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-slate-700 text-sm font-medium mb-1">
                Research cancelled
              </p>
              <p className="text-slate-600 text-sm whitespace-pre-wrap">
                {job.error ?? "This research job was cancelled."}
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              Research is still in progress…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
