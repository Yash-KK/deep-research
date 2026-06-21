export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
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
