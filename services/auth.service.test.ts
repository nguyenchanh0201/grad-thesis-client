import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/error";
import {
  completeGoogleSignIn,
  getGoogleAuthorisationUrl,
  login,
} from "@/services/auth.service";
import { getIdentityMe } from "@/services/identity.service";
import { refreshClient } from "@/lib/api/api-client";

vi.mock("@/services/identity.service", () => ({
  getIdentityMe: vi.fn(),
}));

vi.mock("@/lib/api/api-client", () => ({
  refreshClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  apiClient: {
    post: vi.fn(),
  },
}));

const mockedRefreshPost = vi.mocked(refreshClient.post);
const mockedRefreshGet = vi.mocked(refreshClient.get);
const mockedGetIdentityMe = vi.mocked(getIdentityMe);

describe("auth service session verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    delete process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  });

  it("hydrates the logged-in user from /identity/me after SuperTokens sign-in", async () => {
    mockedRefreshPost.mockResolvedValueOnce({
      data: {
        status: "OK",
        user: { id: "st-user-1", email: "fallback@example.test" },
      },
    });
    mockedGetIdentityMe.mockResolvedValueOnce({
      success: true,
      data: {
        msg: "Authenticated user",
        user: {
          id: "app-user-1",
          email: "user@example.test",
          role: "USER",
          fullName: "Ticket Buyer",
          phone: "+84900000000",
        },
      },
    });

    await expect(
      login({ email: "user@example.test", password: "Password@123" }),
    ).resolves.toEqual({
      accessToken: null,
      user: {
        id: "app-user-1",
        email: "user@example.test",
        role: "USER",
        name: "Ticket Buyer",
        phone: "+84900000000",
      },
    });
  });

  it("rejects sign-in when the SuperTokens response is OK but the backend session is not usable", async () => {
    mockedRefreshPost.mockResolvedValueOnce({
      data: {
        status: "OK",
        user: { id: "st-user-1", email: "fallback@example.test" },
      },
    });
    mockedGetIdentityMe.mockRejectedValueOnce(new UnauthorizedError("missing"));

    await expect(
      login({ email: "user@example.test", password: "Password@123" }),
    ).rejects.toThrow("Authentication failed. Please try again.");
  });

  it("adds a local oauth state when the SuperTokens Google authorisation URL omits one", async () => {
    mockedRefreshGet.mockResolvedValueOnce({
      data: {
        status: "OK",
        urlWithQueryParams:
          "https://accounts.google.com/o/oauth2/v2/auth?client_id=google-client-id",
        pkceCodeVerifier: "verifier-1",
      },
    });

    const url = await getGoogleAuthorisationUrl("/events");
    const state = new URL(url).searchParams.get("state");

    expect(state).toEqual(expect.any(String));
    expect(state).not.toHaveLength(0);
    expect(mockedRefreshGet).toHaveBeenCalledWith(
      "/auth/authorisationurl",
      expect.objectContaining({
        params: expect.objectContaining({
          thirdPartyId: "google",
          redirectURIOnProviderDashboard: `${window.location.origin}/auth/callback/google`,
        }),
      }),
    );
  });

  it("stores the safe destination and current auth page when Google starts from register", async () => {
    mockedRefreshGet.mockResolvedValueOnce({
      data: {
        status: "OK",
        urlWithQueryParams:
          "https://accounts.google.com/o/oauth2/v2/auth?client_id=google-client-id",
      },
    });

    await getGoogleAuthorisationUrl(
      "/buy/music-night/queue?intent=1",
      "/auth/register",
    );

    expect(sessionStorage.getItem("APP_NAME_V1_google_oauth_retry")).toBe(
      JSON.stringify({
        redirectTo: "/buy/music-night/queue?intent=1",
        authPath: "/auth/register",
      }),
    );
  });

  it("returns the stored waiting-room destination after Google callback success", async () => {
    sessionStorage.setItem(
      "APP_NAME_V1_google_oauth_state",
      JSON.stringify({
        state: "state-1",
        redirectTo: "/buy/music-night/queue?intent=1",
        authPath: "/auth/login",
      }),
    );
    sessionStorage.setItem(
      "APP_NAME_V1_google_oauth_retry",
      JSON.stringify({
        redirectTo: "/buy/music-night/queue?intent=1",
        authPath: "/auth/login",
      }),
    );
    mockedRefreshPost.mockResolvedValueOnce({
      data: {
        status: "OK",
        user: { id: "st-user-1", email: "fallback@example.test" },
      },
    });
    mockedGetIdentityMe.mockResolvedValueOnce({
      success: true,
      data: {
        msg: "Authenticated user",
        user: {
          id: "app-user-1",
          email: "user@example.test",
          role: "USER",
          fullName: "Ticket Buyer",
          phone: "+84900000000",
        },
      },
    });

    await expect(
      completeGoogleSignIn(new URLSearchParams("code=abc&state=state-1")),
    ).resolves.toMatchObject({
      redirectTo: "/buy/music-night/queue?intent=1",
    });
    expect(sessionStorage.getItem("APP_NAME_V1_google_oauth_retry")).toBeNull();
  });

  it("rejects invalid Google callback state while preserving safe retry destination", async () => {
    sessionStorage.setItem(
      "APP_NAME_V1_google_oauth_state",
      JSON.stringify({
        state: "state-1",
        redirectTo: "/buy/music-night/queue?intent=1",
        authPath: "/auth/login",
      }),
    );
    sessionStorage.setItem(
      "APP_NAME_V1_google_oauth_retry",
      JSON.stringify({
        redirectTo: "/buy/music-night/queue?intent=1",
        authPath: "/auth/login",
      }),
    );

    await expect(
      completeGoogleSignIn(new URLSearchParams("code=abc&state=state-2")),
    ).rejects.toThrow("Invalid Google sign-in state.");
    expect(sessionStorage.getItem("APP_NAME_V1_google_oauth_state")).toBeNull();
    expect(sessionStorage.getItem("APP_NAME_V1_google_oauth_retry")).toBe(
      JSON.stringify({
        redirectTo: "/buy/music-night/queue?intent=1",
        authPath: "/auth/login",
      }),
    );
  });

  it.each([
    {
      name: "Google success from login preserves event-detail waiting-room destination",
      authPath: "/auth/login",
      redirectTo: "/buy/music-night/queue?intent=1",
    },
    {
      name: "Google success from register preserves event-detail waiting-room destination",
      authPath: "/auth/register",
      redirectTo: "/buy/music-night/queue?intent=1",
    },
    {
      name: "Google success from login preserves event-detail fallback destination",
      authPath: "/auth/login",
      redirectTo: "/events/music-night",
    },
    {
      name: "Google success from register preserves event-detail fallback destination",
      authPath: "/auth/register",
      redirectTo: "/events/music-night",
    },
  ])("$name", async ({ authPath, redirectTo }) => {
    sessionStorage.setItem(
      "APP_NAME_V1_google_oauth_state",
      JSON.stringify({
        state: "state-1",
        redirectTo,
        authPath,
      }),
    );
    sessionStorage.setItem(
      "APP_NAME_V1_google_oauth_retry",
      JSON.stringify({
        redirectTo,
        authPath,
      }),
    );
    mockedRefreshPost.mockResolvedValueOnce({
      data: {
        status: "OK",
        user: { id: "st-user-1", email: "fallback@example.test" },
      },
    });
    mockedGetIdentityMe.mockResolvedValueOnce({
      success: true,
      data: {
        msg: "Authenticated user",
        user: {
          id: "app-user-1",
          email: "user@example.test",
          role: "USER",
          fullName: "Ticket Buyer",
          phone: "+84900000000",
        },
      },
    });

    await expect(
      completeGoogleSignIn(new URLSearchParams("code=abc&state=state-1")),
    ).resolves.toMatchObject({ redirectTo });
  });

  it("diagnoses backend session failures separately from frontend redirect restoration", async () => {
    sessionStorage.setItem(
      "APP_NAME_V1_google_oauth_state",
      JSON.stringify({
        state: "state-1",
        redirectTo: "/buy/music-night/queue?intent=1",
        authPath: "/auth/login",
      }),
    );
    mockedRefreshPost.mockResolvedValueOnce({
      data: {
        status: "OK",
        user: { id: "st-user-1", email: "fallback@example.test" },
      },
    });
    mockedGetIdentityMe.mockRejectedValueOnce(new UnauthorizedError("missing"));

    await expect(
      completeGoogleSignIn(new URLSearchParams("code=abc&state=state-1")),
    ).rejects.toThrow("Authentication failed. Please try again.");
  });
});
