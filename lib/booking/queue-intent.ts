const QUEUE_INTENT_MAX_AGE = 15 * 60 * 1000;

function intentKey(slug: string) {
  return `queue_intent_${slug.replace(/[^a-z0-9-]/gi, "_")}`;
}

export function setQueueIntent(slug: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(intentKey(slug), String(Date.now()));
}

export function clearQueueIntent(slug: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(intentKey(slug));
}

export function hasQueueIntent(slug: string): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(intentKey(slug));
  if (!raw) return false;

  const createdAt = Number.parseInt(raw, 10);
  if (
    Number.isNaN(createdAt) ||
    Date.now() - createdAt > QUEUE_INTENT_MAX_AGE
  ) {
    clearQueueIntent(slug);
    return false;
  }

  return true;
}
