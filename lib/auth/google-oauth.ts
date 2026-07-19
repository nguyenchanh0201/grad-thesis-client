const STATE_KEY = "APP_NAME_V1_google_oauth_state";
const RETRY_KEY = "APP_NAME_V1_google_oauth_retry";

export type GoogleOAuthState = {
  state: string;
  redirectTo: string;
  authPath?: GoogleAuthPath;
  pkceCodeVerifier?: string;
};

export type GoogleAuthPath = "/auth/login" | "/auth/register";

export type GoogleOAuthRetry = {
  redirectTo: string;
  authPath: GoogleAuthPath;
};

export function resolveGoogleAuthPath(
  path: string | null | undefined,
): GoogleAuthPath {
  return path === "/auth/register" ? "/auth/register" : "/auth/login";
}

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
  const authPath = resolveGoogleAuthPath(payload.authPath);
  sessionStorage.setItem(STATE_KEY, JSON.stringify({ ...payload, authPath }));
  sessionStorage.setItem(
    RETRY_KEY,
    JSON.stringify({ redirectTo: payload.redirectTo, authPath }),
  );
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

export function peekGoogleOAuthRetry(): GoogleOAuthRetry | null {
  const saved = sessionStorage.getItem(RETRY_KEY);
  if (!saved) return null;

  try {
    const parsed = JSON.parse(saved) as Partial<GoogleOAuthRetry>;
    if (typeof parsed.redirectTo !== "string") return null;
    return {
      redirectTo: parsed.redirectTo,
      authPath: resolveGoogleAuthPath(parsed.authPath),
    };
  } catch {
    return null;
  }
}

export function consumeGoogleOAuthRetry(): GoogleOAuthRetry | null {
  const retry = peekGoogleOAuthRetry();
  sessionStorage.removeItem(RETRY_KEY);
  return retry;
}

export function clearGoogleOAuthRetry(): void {
  sessionStorage.removeItem(RETRY_KEY);
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
