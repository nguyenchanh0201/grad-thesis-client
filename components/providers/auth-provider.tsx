"use client";

import { useEffect } from "react";

import { readPersistedUser, useAuthStore } from "@/lib/store/auth.store";
import { getIdentityMe } from "@/services/identity.service";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { clearAuth, setAuth, setInitialized } = useAuthStore.getState();

    // Restore the persisted user immediately so guards and the nav bar
    // reflect the correct state before the refresh call completes.
    const stored = readPersistedUser();
    if (stored) {
      useAuthStore.setState({ user: stored });
    }

    // Hydrate from the backend session. The API client refresh interceptor
    // handles an expired SuperTokens access cookie before this resolves.
    getIdentityMe()
      .then((res) => {
        setAuth(null, {
          id: res.data.user.id,
          email: res.data.user.email,
          role: res.data.user.role,
        });
      })
      .catch(() => clearAuth())
      .finally(() => setInitialized());
  }, []);

  return <>{children}</>;
}
