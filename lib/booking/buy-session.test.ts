import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buySessionStorageKey,
  hasBuySession,
  setBuySession,
} from "@/lib/booking/buy-session";
import { useBuySessionTimerStore } from "@/lib/store/buy-session-timer.store";

describe("buy session timer persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T10:00:00.000Z"));
    localStorage.clear();
    useBuySessionTimerStore.getState().clear("music-night");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("replaces an older same-event timer when a new queue admission starts", () => {
    const oldExpiryMs = new Date("2026-05-21T10:01:00.000Z").getTime();
    const newExpiryIso = "2026-05-21T10:15:00.000Z";
    const newExpiryMs = new Date(newExpiryIso).getTime();

    useBuySessionTimerStore.getState().setExpiryMs("music-night", oldExpiryMs);

    expect(setBuySession("music-night", newExpiryIso)).toBe(true);

    expect(localStorage.getItem(buySessionStorageKey("music-night"))).toBe(
      String(newExpiryMs),
    );
    expect(useBuySessionTimerStore.getState().getExpiryMs("music-night")).toBe(
      newExpiryMs,
    );
    expect(hasBuySession("music-night")).toBe(true);
  });

  it("clears persisted state and rejects an already expired queue admission", () => {
    useBuySessionTimerStore
      .getState()
      .setExpiryMs(
        "music-night",
        new Date("2026-05-21T10:05:00.000Z").getTime(),
      );
    localStorage.setItem(
      buySessionStorageKey("music-night"),
      String(new Date("2026-05-21T10:05:00.000Z").getTime()),
    );

    expect(setBuySession("music-night", "2026-05-21T09:59:00.000Z")).toBe(
      false,
    );

    expect(
      localStorage.getItem(buySessionStorageKey("music-night")),
    ).toBeNull();
    expect(
      useBuySessionTimerStore.getState().getExpiryMs("music-night"),
    ).toBeUndefined();
    expect(hasBuySession("music-night")).toBe(false);
  });
});
