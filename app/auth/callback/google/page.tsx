"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useCompleteGoogleSignIn } from "@/hooks/use-auth";

export default function GoogleCallbackPage() {
  const { mutate, isPending, isError } = useCompleteGoogleSignIn();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    mutate(new URLSearchParams(window.location.search));
  }, [mutate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3 p-4 text-center">
        {isPending && (
          <>
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Completing Google sign-in...
            </p>
          </>
        )}

        {isError && (
          <>
            <p className="text-sm text-muted-foreground">
              Google sign-in could not be completed.
            </p>
            <Link
              href="/auth/login?error=google_failed"
              className="text-sm text-primary underline underline-offset-4"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
