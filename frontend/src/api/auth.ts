import { User } from "../types";
import api from "./axios";

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export function getGoogleLoginUrl(): string {
  return `${import.meta.env.VITE_API_URL}/auth/login`;
}
