const COOKIE_MAX_AGE = 660; // 11 min in seconds

function cookieName(slug: string) {
  return `buy_session_${slug.replace(/[^a-z0-9-]/gi, "_")}`;
}

/** Called by the queue page when the user is admitted. */
export function setBuySession(slug: string) {
  const name = cookieName(slug);
  document.cookie = `${name}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
  sessionStorage.setItem(name, String(Date.now()));
}

/** Called on timeout or explicit cancellation. */
export function clearBuySession(slug: string) {
  const name = cookieName(slug);
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
  sessionStorage.removeItem(name);
}

export function getBuySessionDeadline(slug: string): Date | null {
  try {
    const name = cookieName(slug);
    const raw = sessionStorage.getItem(name);
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
    const raw = sessionStorage.getItem(name);
    if (!raw) return false;
    const elapsedSeconds = (Date.now() - parseInt(raw, 10)) / 1000;
    if (elapsedSeconds > COOKIE_MAX_AGE) {
      sessionStorage.removeItem(name); // expired — purge preemptively
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
