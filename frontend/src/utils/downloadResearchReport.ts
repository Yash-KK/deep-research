import { format } from "date-fns";
import markdownDocx, { Packer } from "markdown-docx";

import { ResearchJob } from "../types";

function reportFilename(job: ResearchJob, extension: string) {
  return `research-${job.id.slice(0, 8)}.${extension}`;
}

export function buildReportMarkdown(job: ResearchJob): string {
  return [
    ``,
    `**Question:** ${job.question}`,
    `**Date:** ${format(new Date(job.created_at), "PPpp")}`,
    `**Status:** ${job.status}`,
    ``,
    `---`,
    ``,
    job.result ?? job.error ?? "No content.",
  ].join("\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadReportMarkdown(job: ResearchJob) {
  const blob = new Blob([buildReportMarkdown(job)], { type: "text/markdown" });
  triggerDownload(blob, reportFilename(job, "md"));
}

export async function downloadReportDocx(job: ResearchJob) {
  const doc = await markdownDocx(buildReportMarkdown(job));
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, reportFilename(job, "docx"));
}
