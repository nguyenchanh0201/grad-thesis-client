"use client";

import { useEffect, useRef, useState } from "react";
import { getBuySessionDeadline } from "@/lib/booking/buy-session";

const TIMER_KEY = "buy_timer_expiry";
const FALLBACK_SECS = 11 * 60;

function timerKey(slug?: string): string {
  return slug ? `${TIMER_KEY}_${slug.replace(/[^a-z0-9-]/gi, "_")}` : TIMER_KEY;
}

function readRemaining(key: string, slug?: string): number {
  try {
    const raw = localStorage.getItem(key);
    const storedExpiryMs = raw ? parseInt(raw, 10) : undefined;
    const sessionExpiryMs = slug ? getBuySessionDeadline(slug)?.getTime() : 0;
    const expiryMs =
      storedExpiryMs && sessionExpiryMs
        ? Math.max(storedExpiryMs, sessionExpiryMs)
        : (storedExpiryMs ?? sessionExpiryMs);
    if (!expiryMs) return FALLBACK_SECS;
    return Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
  } catch {
    return FALLBACK_SECS;
  }
}

export function useTicketTimer(slug?: string) {
  const key = timerKey(slug);
  // Lazy init reads the shared expiry once on mount.
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    if (typeof window === "undefined") return FALLBACK_SECS;
    return readRemaining(key, slug);
  });
  const [timedOut, setTimedOut] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return readRemaining(key, slug) <= 0;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick + timeout detection in one effect — setState is inside the interval
  // callback, not synchronously in the effect body, so no lint violation.
  useEffect(() => {
    if (timedOut) return;
    const id = setInterval(() => {
      setTimeRemaining(() => {
        const next = readRemaining(key, slug);
        if (next === 0) {
          setTimedOut(true);
        }
        return next;
      });
    }, 1000);
    intervalRef.current = id;
    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [key, slug, timedOut]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.newValue === null) {
        setTimeRemaining(0);
        setTimedOut(true);
        return;
      }
      const next = readRemaining(key, slug);
      setTimeRemaining(next);
      setTimedOut(next <= 0);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, slug]);

  const syncToExpiry = (isoDatetime: string) => {
    const expiryMs = new Date(isoDatetime).getTime();
    try {
      localStorage.setItem(key, String(expiryMs));
    } catch {}
    const secsLeft = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
    if (secsLeft <= 0) {
      setTimedOut(true);
      setTimeRemaining(0);
    } else {
      setTimedOut(false);
      setTimeRemaining(secsLeft);
    }
  };

  const reset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    try {
      localStorage.removeItem(key);
    } catch {}
    setTimedOut(false);
    setTimeRemaining(FALLBACK_SECS);
  };

  const mm = String(Math.floor(timeRemaining / 60)).padStart(2, "0");
  const ss = String(timeRemaining % 60).padStart(2, "0");

  return {
    timeRemaining,
    timedOut,
    formatted: `${mm}:${ss}`,
    reset,
    syncToExpiry,
  };
}
