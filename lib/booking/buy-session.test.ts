import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buySessionStorageKey,
  clearBuySession,
  hasBuySession,
  refreshBuySessionDeadline,
  setBuySession,
} from "@/lib/booking/buy-session";
import { useBuySessionTimerStore } from "@/lib/store/buy-session-timer.store";

describe("buy session timer persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T10:00:00.000Z"));
    localStorage.clear();
    clearBuySession("music-night");
    useBuySessionTimerStore.getState().clear("music-night");
  });

  afterEach(() => {
    clearBuySession("music-night");
    vi.useRealTimers();
  });

  it("creates a session in cookie, localStorage, and timer storage", () => {
    const expiryIso = "2026-05-21T10:15:00.000Z";
    const expiryMs = new Date(expiryIso).getTime();

    expect(setBuySession("music-night", expiryIso)).toBe(true);

    expect(document.cookie).toContain("buy_session_music-night=1");
    expect(localStorage.getItem(buySessionStorageKey("music-night"))).toBe(
      String(expiryMs),
    );
    expect(useBuySessionTimerStore.getState().getExpiryMs("music-night")).toBe(
      expiryMs,
    );
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

  it("refreshes a session with a later backend checkout deadline", () => {
    const initialExpiryIso = "2026-05-21T10:05:00.000Z";
    const checkoutExpiryIso = "2026-05-21T10:20:00.000Z";
    const checkoutExpiryMs = new Date(checkoutExpiryIso).getTime();

    expect(setBuySession("music-night", initialExpiryIso)).toBe(true);
    expect(refreshBuySessionDeadline("music-night", checkoutExpiryIso)).toBe(
      true,
    );

    expect(document.cookie).toContain("buy_session_music-night=1");
    expect(localStorage.getItem(buySessionStorageKey("music-night"))).toBe(
      String(checkoutExpiryMs),
    );
    expect(useBuySessionTimerStore.getState().getExpiryMs("music-night")).toBe(
      checkoutExpiryMs,
    );
  });

  it("clears persisted state when refresh receives an expired deadline", () => {
    expect(setBuySession("music-night", "2026-05-21T10:05:00.000Z")).toBe(true);

    expect(
      refreshBuySessionDeadline("music-night", "2026-05-21T09:59:00.000Z"),
    ).toBe(false);

    expect(document.cookie).not.toContain("buy_session_music-night=1");
    expect(
      localStorage.getItem(buySessionStorageKey("music-night")),
    ).toBeNull();
    expect(
      useBuySessionTimerStore.getState().getExpiryMs("music-night"),
    ).toBeUndefined();
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

  it("clears state when localStorage exists but cookie is missing", () => {
    localStorage.setItem(
      buySessionStorageKey("music-night"),
      String(new Date("2026-05-21T10:05:00.000Z").getTime()),
    );

    expect(hasBuySession("music-night")).toBe(false);

    expect(
      localStorage.getItem(buySessionStorageKey("music-night")),
    ).toBeNull();
  });

  it("clears state when cookie exists but localStorage deadline is missing", () => {
    document.cookie =
      "buy_session_music-night=1; path=/; max-age=300; SameSite=Strict";

    expect(hasBuySession("music-night")).toBe(false);

    expect(document.cookie).not.toContain("buy_session_music-night=1");
  });

  it("clears state when cookie exists but localStorage deadline is expired", () => {
    document.cookie =
      "buy_session_music-night=1; path=/; max-age=300; SameSite=Strict";
    localStorage.setItem(
      buySessionStorageKey("music-night"),
      String(new Date("2026-05-21T09:59:00.000Z").getTime()),
    );

    expect(hasBuySession("music-night")).toBe(false);

    expect(document.cookie).not.toContain("buy_session_music-night=1");
    expect(
      localStorage.getItem(buySessionStorageKey("music-night")),
    ).toBeNull();
  });
});
