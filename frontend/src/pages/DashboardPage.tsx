import { RefreshCw, Telescope } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { deleteJob } from "../api/jobs";
import ChatButton, { ChatCloseButton } from "../components/ChatButton";
import ChatPanel from "../components/ChatPanel";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import JobCard from "../components/JobCard";
import JobDetailModal from "../components/JobDetailModal";
import QuestionForm from "../components/QuestionForm";
import Sidebar from "../components/Sidebar";
import { usePolling } from "../hooks/usePolling";
import { ResearchJob } from "../types";

export default function DashboardPage() {
  const { jobs, loading, error, refetch } = usePolling();
  const [selectedJob, setSelectedJob] = useState<ResearchJob | null>(null);
  const [jobToDelete, setJobToDelete] = useState<ResearchJob | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleDeleteRequest = useCallback((job: ResearchJob) => {
    if (job.status === "pending" || job.status === "running") return;
    setJobToDelete(job);
    setDeleteError(null);
  }, []);

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    if (jobToDelete.status === "pending" || jobToDelete.status === "running") {
      setJobToDelete(null);
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteJob(jobToDelete.id);
      if (selectedJob?.id === jobToDelete.id) {
        setSelectedJob(null);
      }
      setJobToDelete(null);
      await refetch();
    } catch {
      setDeleteError("Failed to delete research job.");
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    refetch();
    setRefreshToken((n) => n + 1);
  };

  const pendingCount = jobs.filter(
    (j) => j.status === "pending" || j.status === "running",
  ).length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;

  useEffect(() => {
    if (!selectedJob) return;
    const updated = jobs.find((j) => j.id === selectedJob.id);
    if (updated) {
      setSelectedJob(updated);
    } else {
      setSelectedJob(null);
    }
  }, [jobs, selectedJob?.id]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      <Sidebar
        pendingCount={pendingCount}
        completedCount={completedCount}
        refreshToken={refreshToken}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-gray-900 font-semibold text-base">
              Research Queue
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {jobs.length === 0
                ? "No research jobs yet"
                : `${jobs.length} job${jobs.length !== 1 ? "s" : ""} · polls every 5 s while active`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </header>

        <div className="px-8 pt-6 pb-4 flex-shrink-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            New Research
          </p>
          <QuestionForm onJobCreated={refetch} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-8 pb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex-shrink-0">
            Your Research Jobs
          </p>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading && jobs.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                Loading…
              </div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="text-center py-16">
                <Telescope size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  Ask your first question above
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-3">
                {deleteError}
              </div>
            )}

            <div className="space-y-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={setSelectedJob}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />

      <ConfirmDeleteDialog
        open={!!jobToDelete}
        message="Are you sure you want to delete?"
        onCancel={() => {
          if (!deleting) setJobToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />

      {chatOpen ? (
        <>
          <ChatPanel onClose={() => setChatOpen(false)} />
          <ChatCloseButton onClick={() => setChatOpen(false)} />
        </>
      ) : (
        <ChatButton onClick={() => setChatOpen(true)} />
      )}
    </div>
  );
}
