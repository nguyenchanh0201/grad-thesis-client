const STATE_KEY = "APP_NAME_V1_google_oauth_state";

export type GoogleOAuthState = {
  state: string;
  redirectTo: string;
  pkceCodeVerifier?: string;
};

export function getGoogleRedirectUri(): string {
  return `${window.location.origin}/auth/callback/google`;
}

export function createGoogleOAuthState(): string {
  return crypto.randomUUID();
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
  authUrl.searchParams.set("state", state);
  return authUrl.toString();
}

export function toRedirectQueryParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  return Object.fromEntries(searchParams.entries());
}
