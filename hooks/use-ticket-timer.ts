"use client";

import { useEffect, useRef, useState } from "react";

// TODO: Change later
const TOTAL_SECONDS = 3000000;
const TIMER_KEY = "buy_timer_start";

function computeRemaining(): number {
  try {
    const raw = sessionStorage.getItem(TIMER_KEY);
    if (!raw) {
      sessionStorage.setItem(TIMER_KEY, String(Date.now()));
      return TOTAL_SECONDS;
    }
    const elapsed = Math.floor((Date.now() - parseInt(raw, 10)) / 1000);
    return Math.max(0, TOTAL_SECONDS - elapsed);
  } catch {
    return TOTAL_SECONDS;
  }
}

export function useTicketTimer() {
  const [timeRemaining, setTimeRemaining] = useState(() => computeRemaining());
  const [timedOut, setTimedOut] = useState(() => computeRemaining() <= 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timedOut) return; // already timed out, don't start interval

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          try {
            sessionStorage.removeItem(TIMER_KEY);
          } catch {}
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timedOut]);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      sessionStorage.setItem(TIMER_KEY, String(Date.now()));
    } catch {}
    setTimedOut(false);
    setTimeRemaining(TOTAL_SECONDS);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          try {
            sessionStorage.removeItem(TIMER_KEY);
          } catch {}
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const mm = String(Math.floor(timeRemaining / 60)).padStart(2, "0");
  const ss = String(timeRemaining % 60).padStart(2, "0");

  return { timeRemaining, timedOut, formatted: `${mm}:${ss}`, reset };
}
