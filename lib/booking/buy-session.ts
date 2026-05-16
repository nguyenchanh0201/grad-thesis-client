const COOKIE_MAX_AGE = 660; // 11 min in seconds
export const BUY_SESSION_CLEARED_EVENT = "buy-session-cleared";

function cookieName(slug: string) {
  return `buy_session_${slug.replace(/[^a-z0-9-]/gi, "_")}`;
}

function safeSlug(slug: string) {
  return slug.replace(/[^a-z0-9-]/gi, "_");
}

function timerStorageKey(slug: string) {
  return `buy_timer_expiry_${safeSlug(slug)}`;
}

function clearBuySessionStorage(slug: string) {
  const name = cookieName(slug);
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
  localStorage.removeItem(name);
  localStorage.removeItem(timerStorageKey(slug));
  localStorage.removeItem("buy_timer_expiry");
}

export function buySessionStorageKey(slug: string) {
  return cookieName(slug);
}

/** Called by the queue page when the user is admitted. */
export function setBuySession(slug: string) {
  const name = cookieName(slug);
  const startedAt = Date.now();
  localStorage.removeItem(timerStorageKey(slug));
  localStorage.removeItem("buy_timer_expiry");
  document.cookie = `${name}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
  localStorage.setItem(name, String(startedAt));
  localStorage.setItem(
    timerStorageKey(slug),
    String(startedAt + COOKIE_MAX_AGE * 1000),
  );
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
    return new Date(parseInt(raw, 10) + COOKIE_MAX_AGE * 1000);
  } catch {
    return null;
  }
}

/**
 * Synchronous check — safe to call during render (useState lazy initializer).
 * Returns false and cleans up if the session is older than COOKIE_MAX_AGE.
 */
export function hasBuySession(slug: string): boolean {
  try {
    const name = cookieName(slug);
    const raw = localStorage.getItem(name);
    if (!raw) return false;
    const elapsedSeconds = (Date.now() - parseInt(raw, 10)) / 1000;
    if (elapsedSeconds > COOKIE_MAX_AGE) {
      clearBuySessionStorage(slug);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
