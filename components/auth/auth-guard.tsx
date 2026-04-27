"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth.store";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

function GuardSkeleton() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  );
}

/**
 * Wraps content that requires authentication.
 * Shows a spinner while the session restore attempt is in flight,
 * then redirects to login (preserving the intended path) if unauthenticated.
 */
export function AuthGuard({
  children,
  redirectTo = "/auth/login",
}: AuthGuardProps) {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized || user) return;
    const intended = window.location.pathname + window.location.search;
    router.replace(`${redirectTo}?redirect=${encodeURIComponent(intended)}`);
  }, [isInitialized, user, router, redirectTo]);

  if (!isInitialized) return <GuardSkeleton />;
  if (!user) return null;

  return <>{children}</>;
}
