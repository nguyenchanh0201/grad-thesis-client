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

export function AuthGuard({
  children,
  redirectTo = "/auth/login",
}: AuthGuardProps) {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user || !isInitialized) return;
    const intended = window.location.pathname + window.location.search;
    router.replace(`${redirectTo}?redirect=${encodeURIComponent(intended)}`);
  }, [user, isInitialized, router, redirectTo]);

  // User present (from persist or fresh login) — render immediately, no flicker.
  if (!isInitialized) return <GuardSkeleton />;

  if (user) return <>{children}</>;

  // No user, initialization done — redirect is firing from the effect.
  return null;
}
