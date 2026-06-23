import api from "./axios";

export interface TavilyUsage {
  used: number;
  limit: number | null;
  plan: string;
  search_usage: number;
}

export async function getTavilyUsage(): Promise<TavilyUsage> {
  const { data } = await api.get<TavilyUsage>("/tavily/usage");
  return data;
}
