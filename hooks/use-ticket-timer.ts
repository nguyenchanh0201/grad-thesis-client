"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useBuySessionTimerStore } from "@/lib/store/buy-session-timer.store";

function timerStoragePrefix(slug: string) {
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "_");
  return `buy_timer_expiry_${safeSlug}`;
}

export function useTicketTimer(slug?: string) {
  const hydrate = useBuySessionTimerStore((state) => state.hydrate);
  const clear = useBuySessionTimerStore((state) => state.clear);
  const sync = useBuySessionTimerStore((state) => state.syncToExpiry);
  const expiryMs = useBuySessionTimerStore((state) =>
    slug ? state.bySlug[slug]?.expiryMs : undefined,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!slug) return;
    hydrate(slug);
  }, [hydrate, slug]);

  useEffect(() => {
    if (!slug) return;

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || !event.key.startsWith(timerStoragePrefix(slug))) return;
      hydrate(slug);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [hydrate, slug]);

  useEffect(() => {
    if (!expiryMs || expiryMs <= Date.now()) return;

    const intervalId = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (nextNow >= expiryMs) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [expiryMs]);

  const computed = useMemo(() => {
    if (!expiryMs) {
      return {
        timeRemaining: 0,
        timedOut: false,
        hasSyncedExpiry: false,
      };
    }

    const remaining = Math.max(0, Math.floor((expiryMs - now) / 1000));
    return {
      timeRemaining: remaining,
      timedOut: remaining <= 0,
      hasSyncedExpiry: true,
    };
  }, [expiryMs, now]);

  const syncToExpiry = useCallback(
    (isoDatetime: string) => {
      if (!slug) return;
      sync(slug, isoDatetime);
      setNow(Date.now());
    },
    [slug, sync],
  );

  const reset = useCallback(() => {
    if (!slug) return;
    clear(slug);
    setNow(Date.now());
  }, [clear, slug]);

  const mm = String(Math.floor(computed.timeRemaining / 60)).padStart(2, "0");
  const ss = String(computed.timeRemaining % 60).padStart(2, "0");

  return {
    timeRemaining: computed.timeRemaining,
    timedOut: computed.timedOut,
    hasSyncedExpiry: computed.hasSyncedExpiry,
    formatted: computed.hasSyncedExpiry ? `${mm}:${ss}` : "--:--",
    reset,
    syncToExpiry,
  };
}
