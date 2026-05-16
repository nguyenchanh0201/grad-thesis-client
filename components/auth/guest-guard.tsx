"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { useAuthStore } from "@/lib/store/auth.store";

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestGuard({ children, redirectTo = "/" }: GuestGuardProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  useEffect(() => {
    if (!user) return;
    router.replace(resolvePostAuthRedirect(redirect, redirectTo));
  }, [user, router, redirectTo, redirect]);

  // Redirect is in flight — render nothing to avoid a flash of the auth form.
  if (user) return null;

  return <>{children}</>;
}
