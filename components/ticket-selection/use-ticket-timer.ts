"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_SECONDS = 600;

export function useTicketTimer() {
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimedOut(false);
    setTimeRemaining(TOTAL_SECONDS);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
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
