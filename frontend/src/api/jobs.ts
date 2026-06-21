import { ResearchJob } from '../types';
import api from './axios';

export async function createJob(question: string): Promise<ResearchJob> {
  const { data } = await api.post<ResearchJob>('/jobs/', { question });
  return data;
}

export async function listJobs(): Promise<ResearchJob[]> {
  const { data } = await api.get<ResearchJob[]>('/jobs/');
  return data;
}

export async function getJob(id: string): Promise<ResearchJob> {
  const { data } = await api.get<ResearchJob>(`/jobs/${id}`);
  return data;
}
