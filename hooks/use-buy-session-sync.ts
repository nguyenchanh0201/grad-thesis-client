"use client";

import { useEffect } from "react";
import {
  BUY_SESSION_CLEARED_EVENT,
  buySessionStorageKey,
} from "@/lib/booking/buy-session";

type BuySessionClearedEvent = CustomEvent<{ slug: string }>;

export function useBuySessionSync(slug: string, onCleared: () => void) {
  useEffect(() => {
    const storageKey = buySessionStorageKey(slug);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue === null) {
        onCleared();
      }
    };

    const handleCleared = (event: Event) => {
      const detail = (event as BuySessionClearedEvent).detail;
      if (detail?.slug === slug) {
        onCleared();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BUY_SESSION_CLEARED_EVENT, handleCleared);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BUY_SESSION_CLEARED_EVENT, handleCleared);
    };
  }, [onCleared, slug]);
}
