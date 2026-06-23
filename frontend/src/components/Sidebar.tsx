import { BookOpen, Globe, LogOut, Telescope } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTavilyUsage, TavilyUsage } from "../api/tavily";
import { useAuthStore } from "../store/authStore";

interface Props {
  pendingCount: number;
  completedCount: number;
  refreshToken?: number;
}

export default function Sidebar({
  pendingCount,
  completedCount,
  refreshToken = 0,
}: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [tavilyUsage, setTavilyUsage] = useState<TavilyUsage | null>(null);
  const [tavilyLoading, setTavilyLoading] = useState(true);

  const fetchTavilyUsage = useCallback(async () => {
    setTavilyLoading(true);
    try {
      const usage = await getTavilyUsage();
      setTavilyUsage(usage);
    } catch {
      setTavilyUsage(null);
    } finally {
      setTavilyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTavilyUsage();
  }, [fetchTavilyUsage, refreshToken]);

  const tavilyPercent =
    tavilyUsage?.limit && tavilyUsage.limit > 0
      ? Math.min(100, Math.round((tavilyUsage.used / tavilyUsage.limit) * 100))
      : null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-60 h-full bg-navy-800 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="px-5 py-6 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
            DA
          </span>
          <div>
            <p className="text-white text-sm font-semibold leading-none">
              DeepAgent
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-3 flex-shrink-0">
        <div className="bg-white/5 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Active Jobs</p>
              <p className="text-white text-2xl font-semibold mt-0.5">
                {pendingCount}
              </p>
            </div>
            <Telescope size={20} className="text-violet-400" />
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">Completed</p>
              <p className="text-white text-2xl font-semibold mt-0.5">
                {completedCount}
              </p>
            </div>
            <BookOpen size={20} className="text-emerald-400" />
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-slate-400 text-xs">Tavily Credits</p>
              {tavilyLoading ? (
                <p className="text-white text-sm font-medium mt-1">Loading…</p>
              ) : tavilyUsage ? (
                <p className="text-white text-lg font-semibold mt-0.5">
                  {tavilyUsage.used}
                  <span className="text-slate-400 text-sm font-normal">
                    {" "}
                    / {tavilyUsage.limit ?? "∞"}
                  </span>
                </p>
              ) : (
                <p className="text-slate-500 text-xs mt-1">Unavailable</p>
              )}
            </div>
            <Globe size={20} className="text-sky-400" />
          </div>
          {tavilyUsage && tavilyPercent !== null && (
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  tavilyPercent >= 90
                    ? "bg-red-400"
                    : tavilyPercent >= 70
                      ? "bg-amber-400"
                      : "bg-sky-400"
                }`}
                style={{ width: `${tavilyPercent}%` }}
              />
            </div>
          )}
          {tavilyUsage && (
            <p className="text-slate-500 text-[10px] mt-1.5 capitalize">
              {tavilyUsage.plan} plan
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0" />

      <div className="px-5 py-5 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 text-xs font-semibold">
            {(user?.full_name ?? user?.email ?? "?")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.full_name ?? "Researcher"}
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
  );
}
