"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { apiClient } from "@/lib/api/api-client";
import { validateGoogleState } from "@/lib/auth/google-oauth";
import { useAuthStore } from "@/lib/store/auth.store";
import { AuthUser } from "@/schemas/user";

interface GoogleAuthResponseData {
  data: { accessToken: string; user: AuthUser };
}

type ParsedParams = { ok: true; code: string } | { ok: false; error: string };

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  const calledRef = useRef(false);

  const [parsed] = useState<ParsedParams>(() => {
    const oauthError = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (oauthError) {
      return { ok: false, error: "Google sign-in was cancelled or denied." };
    }
    if (!code || !state) {
      return { ok: false, error: "Invalid callback — missing parameters." };
    }
    if (!validateGoogleState(state)) {
      return { ok: false, error: "Invalid state parameter. Please try again." };
    }
    return { ok: true, code };
  });

  useEffect(() => {
    if (!parsed.ok || calledRef.current) return;
    calledRef.current = true;

    apiClient
      .post<GoogleAuthResponseData>("/auth/google", { code: parsed.code })
      .then((resBody) => {
        const { accessToken, user } = (
          resBody as unknown as GoogleAuthResponseData
        ).data;
        setAuth(accessToken, user);
        router.replace("/");
      })
      .catch(() =>
        setApiError("Failed to sign in with Google. Please try again."),
      );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const errorMessage = parsed.ok ? apiError : parsed.error;

  if (errorMessage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-destructive">{errorMessage}</p>
        <Link
          href="/auth/login"
          className="text-sm text-primary underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing in with Google…</p>
    </div>
  );
}
