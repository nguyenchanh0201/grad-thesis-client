"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/lib/store/auth.store";

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestGuard({ children, redirectTo = "/" }: GuestGuardProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    router.replace(redirectTo);
  }, [user, router, redirectTo]);

  // Redirect is in flight — render nothing to avoid a flash of the auth form.
  if (user) return null;

  return <>{children}</>;
}
