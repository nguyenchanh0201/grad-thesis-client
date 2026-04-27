"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { login, register, updateProfile } from "@/services/auth.service";
import type { ProfileInput } from "@/services/auth.service";
import { buildGoogleAuthUrl } from "@/lib/auth/google-oauth";
import { apiClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/lib/store/auth.store";
import type { LoginInput, RegisterInput } from "@/schemas/auth";

export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: Pick<LoginInput, "email" | "password">) => login(data),
    onSuccess: ({ user, accessToken }) => {
      setAuth(accessToken, user);
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      router.push("/");
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
      router.push("/");
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => apiClient.post("/auth/logout").catch(() => {}),
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: ["current-user"] });
      router.push("/");
    },
  });
}

export function useUpdateProfile() {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: ProfileInput) => updateProfile(data),
    onSuccess: (partial) => {
      updateUser(partial);
    },
  });
}

export function useLoginWithGoogle() {
  return useMutation({
    mutationFn: async () => {
      window.location.href = buildGoogleAuthUrl();
    },
  });
}
