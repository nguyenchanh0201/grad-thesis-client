import { useBuySessionTimerStore } from "@/lib/store/buy-session-timer.store";

export const BUY_SESSION_CLEARED_EVENT = "buy-session-cleared";

function cookieName(slug: string) {
  return `buy_session_${slug.replace(/[^a-z0-9-]/gi, "_")}`;
}

function clearBuySessionStorage(slug: string) {
  const name = cookieName(slug);
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
  localStorage.removeItem(name);
  useBuySessionTimerStore.getState().clear(slug);
}

function hasCookie(name: string) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${name}=1` || cookie.startsWith(`${name}=`));
}

export function buySessionStorageKey(slug: string) {
  return cookieName(slug);
}

/** Called by the queue page when the user is admitted. */
export function setBuySession(
  slug: string,
  sessionExpiresAt?: string,
): boolean {
  const name = cookieName(slug);
  const expiresAtMs = sessionExpiresAt
    ? new Date(sessionExpiresAt).getTime()
    : NaN;
  const remainingSeconds = Number.isFinite(expiresAtMs)
    ? Math.ceil((expiresAtMs - Date.now()) / 1000)
    : 0;

  useBuySessionTimerStore.getState().clear(slug);

  if (remainingSeconds <= 0) {
    clearBuySessionStorage(slug);
    return false;
  }

  document.cookie = `${name}=1; path=/; max-age=${remainingSeconds}; SameSite=Strict`;
  localStorage.setItem(name, String(expiresAtMs));
  useBuySessionTimerStore.getState().setExpiryMs(slug, expiresAtMs);

  return true;
}

/**
 * Replaces the frontend checkout gate with the backend-authoritative deadline.
 * Used when checkout moves from reservation expiry into payment grace.
 */
export function refreshBuySessionDeadline(
  slug: string,
  checkoutExpiresAt: string,
): boolean {
  const name = cookieName(slug);
  const expiresAtMs = new Date(checkoutExpiresAt).getTime();
  const remainingSeconds = Number.isFinite(expiresAtMs)
    ? Math.ceil((expiresAtMs - Date.now()) / 1000)
    : 0;

  if (remainingSeconds <= 0) {
    clearBuySessionStorage(slug);
    return false;
  }

  document.cookie = `${name}=1; path=/; max-age=${remainingSeconds}; SameSite=Strict`;
  localStorage.setItem(name, String(expiresAtMs));
  useBuySessionTimerStore.getState().replaceExpiryMs(slug, expiresAtMs);

  return true;
}

/** Called on timeout or explicit cancellation. */
export function clearBuySession(slug: string) {
  clearBuySessionStorage(slug);
  window.dispatchEvent(
    new CustomEvent(BUY_SESSION_CLEARED_EVENT, { detail: { slug } }),
  );
}

export function getBuySessionDeadline(slug: string): Date | null {
  try {
    const name = cookieName(slug);
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    const expiryMs = parseInt(raw, 10);
    if (!Number.isFinite(expiryMs)) return null;
    return new Date(expiryMs);
  } catch {
    return null;
  }
}

/**
 * Synchronous check - safe to call during render (useState lazy initializer).
 * Returns false and cleans up when session deadline is missing or expired.
 */
export function hasBuySession(slug: string): boolean {
  try {
    const name = cookieName(slug);
    if (!hasCookie(name)) {
      clearBuySessionStorage(slug);
      return false;
    }

    const raw = localStorage.getItem(name);
    if (!raw) {
      clearBuySessionStorage(slug);
      return false;
    }

    const expiryMs = parseInt(raw, 10);
    if (!Number.isFinite(expiryMs) || expiryMs <= Date.now()) {
      clearBuySessionStorage(slug);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
