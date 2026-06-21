import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Clock, Loader2 } from 'lucide-react';
import { ResearchJob } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  job: ResearchJob;
  onClick: (job: ResearchJob) => void;
}

export default function JobCard({ job, onClick }: Props) {
  const isActive = job.status === 'pending' || job.status === 'running';
  const isClickable = job.status === 'completed' || job.status === 'failed';

  return (
    <div
      onClick={() => isClickable && onClick(job)}
      className={`group bg-white border rounded-xl p-4 transition-all duration-200 ${
        isClickable
          ? 'cursor-pointer hover:border-violet-300 hover:shadow-md hover:shadow-violet-100'
          : 'cursor-default'
      } ${isActive ? 'border-violet-200 bg-violet-50/30' : 'border-gray-200'}`}
    >
      <div className="flex items-start gap-3">
        {/* Left: status indicator */}
        <div className="mt-0.5 flex-shrink-0">
          {isActive ? (
            <Loader2
              size={16}
              className={`${
                job.status === 'running' ? 'text-violet-500 animate-spin' : 'text-amber-400 animate-pulse-slow'
              }`}
            />
          ) : (
            <div
              className={`w-4 h-4 rounded-full mt-0.5 ${
                job.status === 'completed' ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
          )}
        </div>

        {/* Middle: content */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 text-sm font-medium leading-snug line-clamp-2 group-hover:text-violet-700 transition-colors">
            {job.question}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={job.status} />
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock size={11} />
              {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Running hint */}
          {isActive && (
            <p className="text-xs text-violet-500 mt-2 italic">
              {job.status === 'pending'
                ? 'Waiting for a worker to pick this up…'
                : 'DeepAgent is searching the web and synthesising results…'}
            </p>
          )}

          {/* Error hint */}
          {job.status === 'failed' && job.error && (
            <p className="text-xs text-red-500 mt-2 truncate">Error: {job.error}</p>
          )}
        </div>

        {/* Right: chevron for clickable cards */}
        {isClickable && (
          <ChevronRight
            size={16}
            className="text-gray-300 group-hover:text-violet-400 flex-shrink-0 mt-0.5 transition-colors"
          />
        )}
      </div>
    </div>
  );
}
