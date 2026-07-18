import { create } from "zustand";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: sessionStorage.getItem("access_token"),
  isAuthenticated: !!sessionStorage.getItem("access_token"),

  setAuth: (user, token) => {
    sessionStorage.setItem("access_token", token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem("access_token");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
