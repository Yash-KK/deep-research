import { useCallback, useEffect, useRef, useState } from 'react';
import { listJobs } from '../api/jobs';
import { ResearchJob } from '../types';

const POLL_INTERVAL_MS = 3000;

export function usePolling() {
  const [jobs, setJobs] = useState<ResearchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobsRef = useRef<ResearchJob[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await listJobs();
      setJobs(data);
      jobsRef.current = data;
      setError(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch jobs';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Smart polling: always tick, but only fetch when there are active jobs
  // (or on first load)
  useEffect(() => {
    fetchJobs(); // immediate first load

    intervalRef.current = setInterval(() => {
      const hasActive = jobsRef.current.some(
        (j) => j.status === 'pending' || j.status === 'running'
      );
      if (hasActive) fetchJobs();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchJobs]);

  // Force a refresh (e.g. after submitting a new question)
  const refetch = useCallback(() => {
    fetchJobs();
    // Kick the interval back into active mode immediately
    jobsRef.current = jobsRef.current.map((j) => ({
      ...j,
      status: j.status === 'completed' || j.status === 'failed' ? j.status : 'running',
    }));
  }, [fetchJobs]);

  return { jobs, loading, error, refetch };
}
