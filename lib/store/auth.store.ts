import { create } from "zustand";
import type { AuthUser } from "@/services/auth.service";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (accessToken: string, user: AuthUser) => void;
  clearAuth: () => void;
}

// Access token lives in memory only — never persisted (security best practice).
// Session is restored on mount via the httpOnly refresh token cookie (see AuthProvider).
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
