import { describe, expect, it } from "vitest";

import { withRedirectQuery } from "@/lib/auth/redirect";

describe("login/register auth link redirect parity", () => {
  it("preserves event-detail redirect when switching from login to register", () => {
    expect(
      withRedirectQuery("/auth/register", "/buy/music-night/queue?intent=1"),
    ).toBe("/auth/register?redirect=%2Fbuy%2Fmusic-night%2Fqueue%3Fintent%3D1");
  });

  it("preserves event-detail redirect when switching from register to login", () => {
    expect(
      withRedirectQuery("/auth/login", "/buy/music-night/queue?intent=1"),
    ).toBe("/auth/login?redirect=%2Fbuy%2Fmusic-night%2Fqueue%3Fintent%3D1");
  });
});
