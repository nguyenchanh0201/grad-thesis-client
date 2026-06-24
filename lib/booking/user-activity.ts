"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_IDLE_TIMEOUT_MS = 180_000;
const ACTIVITY_THROTTLE_MS = 1_000;

function parsePositiveInt(input: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(input ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const WAITROOM_IDLE_TIMEOUT_MS = parsePositiveInt(
  process.env.NEXT_PUBLIC_WAITROOM_IDLE_TIMEOUT_MS,
  DEFAULT_IDLE_TIMEOUT_MS,
);

export function useUserActivity() {
  const [lastActivityAtMs, setLastActivityAtMs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastRecordedAtRef = useRef(lastActivityAtMs);

  useEffect(() => {
    const markActivity = () => {
      const next = Date.now();
      if (next - lastRecordedAtRef.current < ACTIVITY_THROTTLE_MS) return;
      lastRecordedAtRef.current = next;
      setLastActivityAtMs(next);
      setNowMs(next);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "keydown",
      "mousedown",
      "mousemove",
      "pointerdown",
      "scroll",
      "touchstart",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, markActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(() => setNowMs(Date.now()), 1_000);

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, markActivity),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, []);

  return useMemo(
    () => ({
      isIdle: nowMs - lastActivityAtMs > WAITROOM_IDLE_TIMEOUT_MS,
      lastActivityAt: new Date(lastActivityAtMs).toISOString(),
    }),
    [lastActivityAtMs, nowMs],
  );
}
