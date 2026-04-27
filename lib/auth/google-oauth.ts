const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const STATE_KEY = "APP_NAME_V1_google_oauth_state";

export function buildGoogleAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured");
  }

  const redirectUri = `${window.location.origin}/auth/callback/google`;

  const state = crypto.randomUUID();
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_BASE}?${params}`;
}

export function validateGoogleState(returnedState: string): boolean {
  const saved = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  return !!saved && saved === returnedState;
}
