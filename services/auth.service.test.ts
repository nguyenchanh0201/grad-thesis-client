import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/core/error";
import { login } from "@/services/auth.service";
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
const mockedGetIdentityMe = vi.mocked(getIdentityMe);

describe("auth service session verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
