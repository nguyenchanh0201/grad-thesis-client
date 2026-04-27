"use client";

import { useEffect } from "react";

import { refreshClient } from "@/lib/api/api-client";
import { readPersistedUser, useAuthStore } from "@/lib/store/auth.store";
import type { AuthUser } from "@/services/auth.service";

interface RefreshResponseData {
  data: { accessToken: string; user: AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { setAuth, setInitialized } = useAuthStore.getState();

    // Restore the persisted user immediately so guards and the nav bar
    // reflect the correct state before the refresh call completes.
    const stored = readPersistedUser();
    if (stored) {
      useAuthStore.setState({ user: stored });
    }

    // Attempt to get a fresh access token from the httpOnly refresh cookie.
    // On success: update store with the server-issued token + user.
    // On failure: keep the persisted user for display — do NOT clear it.
    //   Real auth enforcement happens at the API level via the refresh interceptor.
    refreshClient
      .post<RefreshResponseData>("/auth/refresh")
      .then((res) => {
        const { accessToken, user } = res.data.data;
        setAuth(accessToken, user);
      })
      .catch(() => {})
      .finally(() => setInitialized());
  }, []);

  return <>{children}</>;
}
