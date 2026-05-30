"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  completeGoogleSignIn,
  getGoogleAuthorisationUrl,
  login,
  logout,
  register,
} from "@/services/auth.service";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { useAuthStore } from "@/lib/store/auth.store";
import type { LoginInput, RegisterInput } from "@/schemas/auth";

function getRedirectTarget() {
  if (typeof window === "undefined") return "/";
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  return resolvePostAuthRedirect(redirect);
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: Pick<LoginInput, "email" | "password">) => login(data),
    onSuccess: ({ user, accessToken }) => {
      setAuth(accessToken, user);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      router.push(getRedirectTarget());
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: Pick<RegisterInput, "email" | "password">) =>
      register(data),
    onSuccess: ({ user, accessToken }) => {
      setAuth(accessToken, user);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      router.push(getRedirectTarget());
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: ["current-user"] });
      queryClient.removeQueries({ queryKey: ["tickets"] });
      queryClient.removeQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useLoginWithGoogle() {
  return useMutation({
    mutationFn: async () => {
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      window.location.href = await getGoogleAuthorisationUrl(redirect);
    },
  });
}

export function useCompleteGoogleSignIn() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (searchParams: URLSearchParams) =>
      completeGoogleSignIn(searchParams),
    onSuccess: ({ user, accessToken, redirectTo }) => {
      setAuth(accessToken, user);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      router.replace(resolvePostAuthRedirect(redirectTo));
    },
  });
}
