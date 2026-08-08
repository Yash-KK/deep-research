export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  report_limit: number;
  reports_used: number;
}

export interface ResearchJob {
  id: string;
  question: string;
  status: JobStatus;
  result: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}
