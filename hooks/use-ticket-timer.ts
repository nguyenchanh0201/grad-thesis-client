"use client";

import { useEffect, useRef, useState } from "react";

const TIMER_KEY = "buy_timer_expiry";
const FALLBACK_SECS = 11 * 60;

function readRemaining(): number {
  try {
    const raw = sessionStorage.getItem(TIMER_KEY);
    if (!raw) return FALLBACK_SECS;
    return Math.max(0, Math.floor((parseInt(raw, 10) - Date.now()) / 1000));
  } catch {
    return FALLBACK_SECS;
  }
}

export function useTicketTimer() {
  // Lazy init reads sessionStorage once on mount — no effect needed.
  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    if (typeof window === "undefined") return FALLBACK_SECS;
    return readRemaining();
  });
  const [timedOut, setTimedOut] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return readRemaining() <= 0;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick + timeout detection in one effect — setState is inside the interval
  // callback, not synchronously in the effect body, so no lint violation.
  useEffect(() => {
    if (timedOut) return;
    const id = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = Math.max(0, prev - 1);
        if (next === 0) {
          try {
            sessionStorage.removeItem(TIMER_KEY);
          } catch {}
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
  }, [timedOut]);

  const syncToExpiry = (isoDatetime: string) => {
    const expiryMs = new Date(isoDatetime).getTime();
    try {
      sessionStorage.setItem(TIMER_KEY, String(expiryMs));
    } catch {}
    const secsLeft = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
    if (secsLeft <= 0) {
      try {
        sessionStorage.removeItem(TIMER_KEY);
      } catch {}
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
      sessionStorage.removeItem(TIMER_KEY);
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
