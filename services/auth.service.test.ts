import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/error";
import { getGoogleAuthorisationUrl, login } from "@/services/auth.service";
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

  it("retries session hydration when the first /identity/me check is temporarily unauthorized", async () => {
    mockedRefreshPost.mockResolvedValueOnce({
      data: {
        status: "OK",
        user: { id: "st-user-1", email: "fallback@example.test" },
      },
    });
    mockedGetIdentityMe
      .mockRejectedValueOnce(new UnauthorizedError("missing"))
      .mockResolvedValueOnce({
        success: true,
        data: {
          msg: "Authenticated user",
          user: {
            id: "app-user-1",
            email: "user@example.test",
            role: "USER",
            fullName: null,
            phone: null,
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
        name: undefined,
        phone: undefined,
      },
    });
    expect(mockedGetIdentityMe).toHaveBeenCalledTimes(2);
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
});
