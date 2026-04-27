import { AuthUser } from "@/schemas/user";
import { create } from "zustand";

const USER_KEY = "APP_NAME_V1_auth_user";

function persistUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function readPersistedUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isInitialized: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  clearAuth: () => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  setAuth: (accessToken, user) => {
    persistUser(user);
    set({ accessToken, user });
  },
  clearAuth: () => {
    persistUser(null);
    set({ accessToken: null, user: null });
  },
  setInitialized: () => set({ isInitialized: true }),
}));
