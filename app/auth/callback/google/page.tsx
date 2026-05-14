"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login?error=google_not_enabled");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Redirecting to login. Google sign-in is not enabled on this server.
        </p>
        <Link
          href="/auth/login"
          className="text-sm text-primary underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
