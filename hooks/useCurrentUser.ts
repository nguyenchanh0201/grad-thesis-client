"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { STORAGE_KEYS } from "@/core/constants";
import {
  ApiError,
  isAuthError,
  isConflictError,
  NetworkError,
} from "@/core/error";
import { apiClient } from "@/lib/api/api-client";
import {
  CurrentUserSchema,
  IdentityMeResponseSchema,
  type CurrentUser,
} from "@/schemas/api";

const CURRENT_USER_CACHE_KEY = `${STORAGE_KEYS.USER_SETTINGS}_current_user`;
const CURRENT_USER_CACHE_TTL_MS = 5 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined";
}

function readCachedCurrentUser(): CurrentUser | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(CURRENT_USER_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      expiresAt: number;
      data: CurrentUser;
    };

    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(CURRENT_USER_CACHE_KEY);
      return null;
    }

    return CurrentUserSchema.parse(parsed.data);
  } catch {
    window.localStorage.removeItem(CURRENT_USER_CACHE_KEY);
    return null;
  }
}

function writeCachedCurrentUser(user: CurrentUser) {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    CURRENT_USER_CACHE_KEY,
    JSON.stringify({
      data: user,
      expiresAt: Date.now() + CURRENT_USER_CACHE_TTL_MS,
    }),
  );
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  try {
    const response = await apiClient.get("/identity/me");
    const parsed = IdentityMeResponseSchema.parse(response);
    const user = parsed.data.user;

    writeCachedCurrentUser(user);
    return user;
  } catch (error) {
    if (error instanceof ApiError) {
      if (isAuthError(error) || isConflictError(error)) {
        throw error;
      }
    }

    const cached = readCachedCurrentUser();
    if (cached) {
      return cached;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new NetworkError("Unable to load current user", error);
  }
}

export function useCurrentUser(): UseQueryResult<CurrentUser, Error> {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: CURRENT_USER_CACHE_TTL_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        return (
          !isAuthError(error) && !isConflictError(error) && failureCount < 3
        );
      }

      return failureCount < 3;
    },
  });
}

export function useCurrentUserOrGuest(): UseQueryResult<
  CurrentUser | null,
  Error
> {
  const query = useCurrentUser();

  return {
    ...query,
    data: query.data ?? readCachedCurrentUser(),
  } as UseQueryResult<CurrentUser | null, Error>;
}
