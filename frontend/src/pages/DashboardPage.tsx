import { BookOpen, LogOut, RefreshCw, Telescope } from 'lucide-react';
import { useState } from 'react';
import JobCard from '../components/JobCard';
import JobDetailModal from '../components/JobDetailModal';
import QuestionForm from '../components/QuestionForm';
import { usePolling } from '../hooks/usePolling';
import { useAuthStore } from '../store/authStore';
import { ResearchJob } from '../types';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { jobs, loading, error, refetch } = usePolling();
  const [selectedJob, setSelectedJob] = useState<ResearchJob | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pendingCount = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'running'
  ).length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-navy-800 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
              DA
            </span>
            <div>
              <p className="text-white text-sm font-semibold leading-none">DeepAgent</p>
              <p className="text-slate-400 text-xs mt-0.5">Research</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-5 space-y-3">
          <div className="bg-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Active Jobs</p>
                <p className="text-white text-2xl font-semibold mt-0.5">{pendingCount}</p>
              </div>
              <Telescope size={20} className="text-violet-400" />
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Completed</p>
                <p className="text-white text-2xl font-semibold mt-0.5">{completedCount}</p>
              </div>
              <BookOpen size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User */}
        <div className="px-5 py-5 border-t border-white/5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 text-xs font-semibold">
              {(user?.full_name ?? user?.email ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {user?.full_name ?? 'Researcher'}
              </p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-slate-400 hover:text-white text-xs py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-gray-900 font-semibold text-base">Research Queue</h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {jobs.length === 0
                ? 'No research jobs yet'
                : `${jobs.length} job${jobs.length !== 1 ? 's' : ''} · polls every 3 s while active`}
            </p>
          </div>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Question input */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              New Research
            </p>
            <QuestionForm onJobCreated={refetch} />
          </div>

          {/* Job list */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Your Research Jobs
            </p>

            {loading && jobs.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
            )}

            {!loading && jobs.length === 0 && (
              <div className="text-center py-16">
                <Telescope size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Ask your first question above</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onClick={setSelectedJob}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Job detail modal */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
