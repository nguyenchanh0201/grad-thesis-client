"use client";

import { useEffect } from "react";

import { refreshClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/lib/store/auth.store";
import type { AuthUser } from "@/services/auth.service";

interface RefreshResponseData {
  data: { accessToken: string; user: AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    // On every page load, attempt to restore the session using the httpOnly
    // refresh token cookie (set by the server on login). If the cookie is
    // absent or expired the call fails silently and the user stays as a guest.
    refreshClient
      .post<RefreshResponseData>("/auth/refresh")
      .then((res) => {
        const { accessToken, user } = res.data.data;
        setAuth(accessToken, user);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
