import { create } from "zustand";
import { apiClient } from "../api/client";

export type UserRole =
  | "ADMIN"
  | "COMPLIANCE_OFFICER"
  | "RISK_MANAGER"
  | "SECURITY_MANAGER"
  | "PRODUCT_OWNER"
  | "AUDITOR"
  | "EXECUTIVE_READ_ONLY";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: () => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("refresh_token");
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post("/api/auth/login", { email, password });
    const { user, token, refreshToken } = data.data;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    set({ user: null, token: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    try {
      const { data } = await apiClient.get("/api/auth/me");
      const user = data.data;
      localStorage.setItem("auth_user", JSON.stringify(user));
      set({ user });
    } catch {
      await get().logout();
    }
  },
}));
