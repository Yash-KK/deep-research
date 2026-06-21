import { AuthToken, User } from "../types";
import api from "./axios";

export async function login(
  email: string,
  password: string,
): Promise<AuthToken> {
  const { data } = await api.post<AuthToken>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(
  email: string,
  password: string,
  full_name?: string,
): Promise<User> {
  const { data } = await api.post<User>("/auth/register", {
    email,
    password,
    full_name,
  });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function googleLogin(token: string) {
  const response = await api.post("/auth/google", {
    token,
  });

  return response.data;
}
