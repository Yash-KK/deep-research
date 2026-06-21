import { AuthToken, User } from "../types";
import api from "./axios";

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function googleLogin(token: string): Promise<AuthToken> {
  const { data } = await api.post<AuthToken>("/auth/google", { token });
  return data;
}
