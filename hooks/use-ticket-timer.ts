"use client";

import { useEffect, useRef, useState } from "react";

const TIMER_KEY = "buy_timer_expiry";
const FALLBACK_SECS = 3600;

function computeRemaining(): number {
  try {
    const raw = sessionStorage.getItem(TIMER_KEY);
    if (!raw) return FALLBACK_SECS;
    const expiryMs = parseInt(raw, 10);
    return Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
  } catch {
    return FALLBACK_SECS;
  }
}

function startInterval(
  setter: React.Dispatch<React.SetStateAction<number>>,
  onExpire: () => void,
): ReturnType<typeof setInterval> {
  return setInterval(() => {
    setter((prev) => {
      if (prev <= 1) {
        try {
          sessionStorage.removeItem(TIMER_KEY);
        } catch {}
        onExpire();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
}

export function useTicketTimer() {
  const [timeRemaining, setTimeRemaining] = useState(() => computeRemaining());
  const [timedOut, setTimedOut] = useState(() => computeRemaining() <= 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const expire = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimedOut(true);
  };

  useEffect(() => {
    if (timedOut) return;
    intervalRef.current = startInterval(setTimeRemaining, expire);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timedOut]);

  const syncToExpiry = (isoDatetime: string) => {
    const expiryMs = new Date(isoDatetime).getTime();
    try {
      sessionStorage.setItem(TIMER_KEY, String(expiryMs));
    } catch {}
    const secsLeft = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (secsLeft <= 0) {
      setTimedOut(true);
      setTimeRemaining(0);
      return;
    }
    setTimeRemaining(secsLeft);
    setTimedOut(false);
    intervalRef.current = startInterval(setTimeRemaining, expire);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
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
