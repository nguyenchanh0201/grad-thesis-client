"use client";

import { useEffect } from "react";

import { UnauthorizedError } from "@/core/error";
import { readPersistedUser, useAuthStore } from "@/lib/store/auth.store";
import { getIdentityMe } from "@/services/identity.service";

const SESSION_HYDRATION_ATTEMPTS = 4;
const SESSION_HYDRATION_RETRY_DELAY_MS = 150;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getIdentityMeWithRetry() {
  for (let attempt = 1; attempt <= SESSION_HYDRATION_ATTEMPTS; attempt += 1) {
    try {
      return await getIdentityMe();
    } catch (error) {
      if (
        !(error instanceof UnauthorizedError) ||
        attempt === SESSION_HYDRATION_ATTEMPTS
      ) {
        throw error;
      }
      await delay(SESSION_HYDRATION_RETRY_DELAY_MS);
    }
  }

  return getIdentityMe();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { clearAuth, setAuth, setInitialized } = useAuthStore.getState();
    const persistedUser = readPersistedUser();
    if (persistedUser) {
      setAuth(null, persistedUser);
    }

    // OAuth callback routes (e.g. /auth/callback/google) run their own
    // authoritative session check via completeGoogleSignIn(), which awaits
    // the actual sign-in exchange before verifying the session. Running this
    // hydration check here too would race it: this check starts immediately
    // on mount, before the OAuth exchange can possibly have finished, so it
    // is guaranteed to 401 and can clear/redirect a session that the OAuth
    // flow is still in the middle of establishing.
    if (
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/auth/callback/")
    ) {
      setInitialized();
      return;
    }

    const hydrationUser = useAuthStore.getState().user;

    // Hydrate from the backend session. The API client refresh interceptor
    // handles an expired SuperTokens access cookie before this resolves.
    getIdentityMeWithRetry()
      .then((res) => {
        setAuth(null, {
          id: res.data.user.id,
          email: res.data.user.email,
          role: res.data.user.role,
        });
      })
      .catch((error) => {
        if (
          error instanceof UnauthorizedError &&
          useAuthStore.getState().user === hydrationUser
        ) {
          clearAuth();
        }
      })
      .finally(() => setInitialized());
  }, []);

  return <>{children}</>;
}
