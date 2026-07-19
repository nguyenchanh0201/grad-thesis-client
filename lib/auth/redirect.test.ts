import { describe, expect, it } from "vitest";

import {
  resolvePostAuthRedirect,
  withRedirectQuery,
} from "@/lib/auth/redirect";

describe("auth redirect helpers", () => {
  it("preserves safe application routes with query strings", () => {
    expect(resolvePostAuthRedirect("/buy/music-night/queue?intent=1")).toBe(
      "/buy/music-night/queue?intent=1",
    );
  });

  it("falls back for missing, external, protocol-relative, and auth-loop redirects", () => {
    expect(resolvePostAuthRedirect(null, "/events")).toBe("/events");
    expect(resolvePostAuthRedirect("https://evil.test", "/events")).toBe(
      "/events",
    );
    expect(resolvePostAuthRedirect("//evil.test", "/events")).toBe("/events");
    expect(resolvePostAuthRedirect("/auth/login", "/events")).toBe("/events");
  });

  it("adds safe redirects to auth routes that already contain query strings", () => {
    expect(
      withRedirectQuery(
        "/auth/login?error=google_failed",
        "/buy/music-night/queue?intent=1",
      ),
    ).toBe(
      "/auth/login?error=google_failed&redirect=%2Fbuy%2Fmusic-night%2Fqueue%3Fintent%3D1",
    );
  });

  it("omits unsafe redirect values from auth route links", () => {
    expect(withRedirectQuery("/auth/login", "https://evil.test")).toBe(
      "/auth/login",
    );
  });

  it.each([
    ["https://evil.test"],
    ["//evil.test"],
    ["/auth/login?redirect=%2Fevents"],
    ["/auth/register"],
  ])(
    "rejects unsafe redirect %s for email/password and Google parity",
    (value) => {
      expect(resolvePostAuthRedirect(value, "/")).toBe("/");
      expect(withRedirectQuery("/auth/login?error=google_failed", value)).toBe(
        "/auth/login?error=google_failed",
      );
    },
  );
});
