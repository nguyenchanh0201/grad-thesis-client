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

/** Synchronous check — safe to call during render (useState lazy initializer). */
export function hasBuySession(slug: string): boolean {
  try {
    return !!sessionStorage.getItem(cookieName(slug));
  } catch {
    return false;
  }
}
