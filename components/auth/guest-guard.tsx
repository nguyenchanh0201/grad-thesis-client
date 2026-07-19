"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { useAuthStore } from "@/lib/store/auth.store";

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestGuard({ children, redirectTo = "/" }: GuestGuardProps) {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const isAuthCallback = pathname.startsWith("/auth/callback/");

  useEffect(() => {
    if (isAuthCallback) return;
    if (!isInitialized || !user) return;
    router.replace(resolvePostAuthRedirect(redirect, redirectTo));
  }, [isAuthCallback, isInitialized, user, router, redirectTo, redirect]);

  if (!isInitialized && !isAuthCallback) return null;

  // Redirect is in flight — render nothing to avoid a flash of the auth form.
  if (user && !isAuthCallback) return null;

  return <>{children}</>;
}
