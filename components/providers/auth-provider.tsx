"use client";

import { useEffect } from "react";

import { refreshClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/lib/store/auth.store";
import type { AuthUser } from "@/services/auth.service";

interface RefreshResponseData {
  data: { accessToken: string; user: AuthUser };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setInitialized } = useAuthStore();

  useEffect(() => {
    refreshClient
      .post<RefreshResponseData>("/auth/refresh")
      .then((res) => {
        const { accessToken, user } = res.data.data;
        setAuth(accessToken, user);
      })
      .catch(() => {})
      .finally(() => setInitialized());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
