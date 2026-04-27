"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth.store";

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Wraps content that should only be visible to unauthenticated users
 * (login, register pages).
 * Renders children immediately while the session check is in flight —
 * auth pages are lightweight enough that a brief render is acceptable.
 * Once initialized, redirects home if the user is already logged in.
 */
export function GuestGuard({ children, redirectTo = "/" }: GuestGuardProps) {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || !user) return;
    router.replace(redirectTo);
  }, [isInitialized, user, router, redirectTo]);

  if (isInitialized && user) return null; // redirect in flight

  return <>{children}</>;
}
