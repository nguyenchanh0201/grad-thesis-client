import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/error";
import { apiClient, refreshClient } from "@/lib/api/api-client";
import { useAuthStore } from "@/lib/store/auth.store";

const authUser = {
  id: "user-1",
  email: "user@example.com",
  role: "USER" as const,
};

function axiosResponse(
  config: InternalAxiosRequestConfig,
  data: unknown,
  status = 200,
): AxiosResponse {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
  };
}

function axiosError(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = {
    success: false,
    statusCode: status,
    error: {
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      path: config.url ?? "",
      timestamp: "2026-05-31T00:00:00.000Z",
    },
  },
) {
  return new AxiosError(
    "Request failed",
    undefined,
    config,
    {},
    axiosResponse(config, data, status),
  );
}

function resolveAdapter(data: unknown): AxiosAdapter {
  return (config) =>
    Promise.resolve(axiosResponse(config as InternalAxiosRequestConfig, data));
}

function rejectAdapter(status: number, data?: unknown): AxiosAdapter {
  return (config) =>
    Promise.reject(
      axiosError(config as InternalAxiosRequestConfig, status, data),
    );
}

function setLoggedInUser() {
  useAuthStore.getState().setAuth(null, authUser);
}

describe("api client auth handling", () => {
  const originalApiAdapter = apiClient.defaults.adapter;
  const originalRefreshAdapter = refreshClient.defaults.adapter;

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.replaceState(null, "", "/");
    useAuthStore.getState().clearAuth();
    apiClient.defaults.adapter = originalApiAdapter;
    refreshClient.defaults.adapter = originalRefreshAdapter;
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
    apiClient.defaults.adapter = originalApiAdapter;
    refreshClient.defaults.adapter = originalRefreshAdapter;
  });

  it("preserves the current user when /identity/me refresh fails during session hydration", async () => {
    setLoggedInUser();
    refreshClient.defaults.adapter = rejectAdapter(401);

    await expect(
      apiClient.get("/identity/me", { adapter: rejectAdapter(401) }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(useAuthStore.getState().user).toEqual(authUser);
  });

  it("preserves the current user when a retried /identity/me call still returns 401", async () => {
    setLoggedInUser();

    await expect(
      apiClient.get("/identity/me", {
        adapter: rejectAdapter(401),
        _retry: true,
      } as never),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(useAuthStore.getState().user).toEqual(authUser);
  });

  it("preserves login state when heartbeat reports a lost waitroom session", async () => {
    setLoggedInUser();
    refreshClient.defaults.adapter = resolveAdapter({ status: "OK" });

    await expect(
      apiClient.post(
        "/tickets/heartbeat",
        { slug: "music-night", token: "expired-token" },
        { adapter: rejectAdapter(401) },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(useAuthStore.getState().user).toEqual(authUser);
  });

  it("clears auth when a protected endpoint cannot refresh the backend session", async () => {
    setLoggedInUser();
    refreshClient.defaults.adapter = rejectAdapter(401);

    await expect(
      apiClient.get("/reservations/my", { adapter: rejectAdapter(401) }),
    ).rejects.toBeInstanceOf(UnauthorizedError);

    expect(useAuthStore.getState().user).toBeNull();
  });

  it("retries protected requests after a successful session refresh", async () => {
    setLoggedInUser();
    const refreshAdapter = vi.fn(resolveAdapter({ status: "OK" }));
    const requestAdapter = vi.fn<AxiosAdapter>((config) => {
      const typedConfig = config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      if (!typedConfig._retry) {
        return Promise.reject(axiosError(typedConfig, 401));
      }
      return Promise.resolve(axiosResponse(typedConfig, { status: true }));
    });
    refreshClient.defaults.adapter = refreshAdapter;

    await expect(
      apiClient.get("/reservations/my", { adapter: requestAdapter }),
    ).resolves.toEqual({ status: true });

    expect(refreshAdapter).toHaveBeenCalledTimes(1);
    expect(requestAdapter).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().user).toEqual(authUser);
  });
});
