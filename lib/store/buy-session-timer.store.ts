import { create } from "zustand";

const TIMER_KEY = "buy_timer_expiry";
const TIMER_SOURCE_VALUE = "backend";

type TimerEntry = {
  expiryMs: number;
};

type BuySessionTimerState = {
  bySlug: Record<string, TimerEntry | undefined>;
  hydrate: (slug: string) => void;
  syncToExpiry: (slug: string, isoDatetime: string) => void;
  setExpiryMs: (slug: string, expiryMs: number) => void;
  clear: (slug: string) => void;
  getExpiryMs: (slug: string) => number | undefined;
};

function safeSlug(slug: string) {
  return slug.replace(/[^a-z0-9-]/gi, "_");
}

function timerKey(slug: string) {
  return `${TIMER_KEY}_${safeSlug(slug)}`;
}

function timerSourceKey(slug: string) {
  return `${timerKey(slug)}_source`;
}

function readBackendExpiryMs(slug: string): number | undefined {
  if (typeof window === "undefined") return undefined;
  const key = timerKey(slug);
  if (localStorage.getItem(timerSourceKey(slug)) !== TIMER_SOURCE_VALUE) {
    return undefined;
  }

  const raw = localStorage.getItem(key);
  const parsed = raw ? parseInt(raw, 10) : undefined;
  return parsed && Number.isFinite(parsed) ? parsed : undefined;
}

function writeBackendExpiryMs(slug: string, expiryMs: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(timerSourceKey(slug), TIMER_SOURCE_VALUE);
  localStorage.setItem(timerKey(slug), String(expiryMs));
}

function clearTimerStorage(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(timerKey(slug));
  localStorage.removeItem(timerSourceKey(slug));
  // backward compatibility for old single-key timer.
  localStorage.removeItem(TIMER_KEY);
  localStorage.removeItem(`${TIMER_KEY}_source`);
}

export const useBuySessionTimerStore = create<BuySessionTimerState>()(
  (set, get) => ({
    bySlug: {},

    hydrate: (slug) => {
      const expiryMs = readBackendExpiryMs(slug);
      set((state) => ({
        bySlug: {
          ...state.bySlug,
          [slug]: expiryMs && expiryMs > 0 ? { expiryMs } : undefined,
        },
      }));
    },

    syncToExpiry: (slug, isoDatetime) => {
      const parsedExpiryMs = new Date(isoDatetime).getTime();
      if (!Number.isFinite(parsedExpiryMs)) return;

      set((state) => {
        const currentExpiry = state.bySlug[slug]?.expiryMs;
        const normalizedExpiryMs =
          currentExpiry && currentExpiry > 0
            ? Math.min(currentExpiry, parsedExpiryMs)
            : parsedExpiryMs;
        writeBackendExpiryMs(slug, normalizedExpiryMs);
        return {
          bySlug: {
            ...state.bySlug,
            [slug]: { expiryMs: normalizedExpiryMs },
          },
        };
      });
    },

    setExpiryMs: (slug, expiryMs) => {
      if (!Number.isFinite(expiryMs) || expiryMs <= 0) {
        get().clear(slug);
        return;
      }

      set((state) => {
        const currentExpiry = state.bySlug[slug]?.expiryMs;
        const normalizedExpiryMs =
          currentExpiry && currentExpiry > 0
            ? Math.min(currentExpiry, expiryMs)
            : expiryMs;
        writeBackendExpiryMs(slug, normalizedExpiryMs);
        return {
          bySlug: {
            ...state.bySlug,
            [slug]: { expiryMs: normalizedExpiryMs },
          },
        };
      });
    },

    clear: (slug) => {
      clearTimerStorage(slug);
      set((state) => ({
        bySlug: {
          ...state.bySlug,
          [slug]: undefined,
        },
      }));
    },

    getExpiryMs: (slug) => get().bySlug[slug]?.expiryMs,
  }),
);
