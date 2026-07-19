import { beforeEach, describe, expect, it } from "vitest";

import { buildGoogleCallbackFailureHref } from "@/app/auth/callback/google/page";
import { storeGoogleOAuthState } from "@/lib/auth/google-oauth";

describe("Google callback page helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns to login with the preserved redirect after Google failure", () => {
    storeGoogleOAuthState({
      state: "state-1",
      redirectTo: "/buy/music-night/queue?intent=1",
      authPath: "/auth/login",
    });

    expect(buildGoogleCallbackFailureHref()).toBe(
      "/auth/login?error=google_failed&redirect=%2Fbuy%2Fmusic-night%2Fqueue%3Fintent%3D1",
    );
  });

  it("returns to register with the preserved redirect after Google failure", () => {
    storeGoogleOAuthState({
      state: "state-1",
      redirectTo: "/buy/music-night/queue?intent=1",
      authPath: "/auth/register",
    });

    expect(buildGoogleCallbackFailureHref()).toBe(
      "/auth/register?error=google_failed&redirect=%2Fbuy%2Fmusic-night%2Fqueue%3Fintent%3D1",
    );
  });
});
