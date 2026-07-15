import { beforeEach, describe, expect, it } from "vitest";

import {
  appendGoogleOAuthState,
  consumeGoogleOAuthState,
  createGoogleOAuthState,
  getGoogleOAuthState,
  getGoogleRedirectUri,
  storeGoogleOAuthState,
  toRedirectQueryParams,
} from "@/lib/auth/google-oauth";

const STATE_KEY = "APP_NAME_V1_google_oauth_state";

describe("google oauth helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    window.history.replaceState(null, "", "/auth/register");
  });

  it("builds the frontend Google callback redirect uri from the current origin", () => {
    expect(getGoogleRedirectUri()).toBe(
      `${window.location.origin}/auth/callback/google`,
    );
  });

  it("uses the configured Google callback redirect uri when provided", () => {
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI =
      " http://localhost:3000/auth/callback/google ";

    expect(getGoogleRedirectUri()).toBe(
      "http://localhost:3000/auth/callback/google",
    );
  });

  it("stores and consumes a matching oauth state exactly once", () => {
    storeGoogleOAuthState({
      state: "state-1",
      redirectTo: "/events",
      pkceCodeVerifier: "verifier-1",
    });

    expect(consumeGoogleOAuthState("state-1")).toEqual({
      state: "state-1",
      redirectTo: "/events",
      pkceCodeVerifier: "verifier-1",
    });
    expect(consumeGoogleOAuthState("state-1")).toBeNull();
  });

  it("creates a non-empty oauth state value", () => {
    expect(createGoogleOAuthState()).toEqual(expect.any(String));
    expect(createGoogleOAuthState()).not.toHaveLength(0);
  });

  it("rejects mismatched oauth state values", () => {
    storeGoogleOAuthState({ state: "state-1", redirectTo: "/" });

    expect(consumeGoogleOAuthState("state-2")).toBeNull();
    expect(sessionStorage.getItem(STATE_KEY)).toBeNull();
  });

  it("rejects malformed stored oauth state", () => {
    sessionStorage.setItem(STATE_KEY, "not-json");

    expect(consumeGoogleOAuthState("state-1")).toBeNull();
  });

  it("preserves the backend oauth state in the authorisation url", () => {
    const url = appendGoogleOAuthState(
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&state=backend-state",
      "state-1",
    );

    const parsed = new URL(url);
    expect(parsed.searchParams.get("client_id")).toBe("abc");
    expect(parsed.searchParams.get("state")).toBe("backend-state");
  });

  it("adds a fallback state when the backend url does not include one", () => {
    const url = appendGoogleOAuthState(
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=abc",
      "state-1",
    );

    const parsed = new URL(url);
    expect(parsed.searchParams.get("state")).toBe("state-1");
  });

  it("reads the backend oauth state from the authorisation url", () => {
    expect(
      getGoogleOAuthState(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=abc&state=backend-state",
      ),
    ).toBe("backend-state");
  });

  it("copies callback query params for the backend token exchange", () => {
    const params = new URLSearchParams("code=abc&scope=email&state=state-1");

    expect(toRedirectQueryParams(params)).toEqual({
      code: "abc",
      scope: "email",
      state: "state-1",
    });
  });
});
