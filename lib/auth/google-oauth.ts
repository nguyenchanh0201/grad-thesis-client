const STATE_KEY = "APP_NAME_V1_google_oauth_state";

export type GoogleOAuthState = {
  state: string;
  redirectTo: string;
  pkceCodeVerifier?: string;
};

export function getGoogleRedirectUri(): string {
  const configuredRedirectUri =
    process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI?.trim();

  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  return `${window.location.origin}/auth/callback/google`;
}

export function createGoogleOAuthState(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function storeGoogleOAuthState(payload: GoogleOAuthState): void {
  sessionStorage.setItem(STATE_KEY, JSON.stringify(payload));
}

export function consumeGoogleOAuthState(
  returnedState: string | null,
): GoogleOAuthState | null {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);

  if (!saved || !returnedState) return null;

  try {
    const parsed = JSON.parse(saved) as GoogleOAuthState;
    return parsed.state === returnedState ? parsed : null;
  } catch {
    return null;
  }
}

export function appendGoogleOAuthState(url: string, state: string): string {
  const authUrl = new URL(url);
  if (!authUrl.searchParams.has("state")) {
    authUrl.searchParams.set("state", state);
  }
  return authUrl.toString();
}

export function getGoogleOAuthState(url: string): string | null {
  return new URL(url).searchParams.get("state");
}

export function toRedirectQueryParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}
