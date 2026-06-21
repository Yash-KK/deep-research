import { ResearchJob, JobStatus } from '../types';
import api from './axios';

function normalizeJobStatus(status: string): JobStatus {
  return status.toLowerCase() as JobStatus;
}

function normalizeJob(job: ResearchJob): ResearchJob {
  return { ...job, status: normalizeJobStatus(job.status) };
}

export async function createJob(question: string): Promise<ResearchJob> {
  const { data } = await api.post<ResearchJob>('/jobs/', { question });
  return normalizeJob(data);
}

export async function listJobs(): Promise<ResearchJob[]> {
  const { data } = await api.get<ResearchJob[]>('/jobs/');
  return data.map(normalizeJob);
}

export async function getJob(id: string): Promise<ResearchJob> {
  const { data } = await api.get<ResearchJob>(`/jobs/${id}`);
  return normalizeJob(data);
}

export async function deleteJob(id: string): Promise<void> {
  await api.delete(`/jobs/${id}`);
}
