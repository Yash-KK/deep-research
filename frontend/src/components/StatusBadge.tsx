import { JobStatus } from '../types';

const config: Record<JobStatus, { label: string; className: string; dot: string }> = {
  pending: {
    label: 'Queued',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400 animate-pulse-slow',
  },
  running: {
    label: 'Researching…',
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    dot: 'bg-violet-400 animate-pulse',
  },
  completed: {
    label: 'Ready',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dot: 'bg-red-400',
  },
};

export default function StatusBadge({ status }: { status: JobStatus }) {
  const { label, className, dot } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
