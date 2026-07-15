import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBuySessionTimerStore } from "@/lib/store/buy-session-timer.store";

describe("buy session timer store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T10:00:00.000Z"));
    localStorage.clear();
    useBuySessionTimerStore.getState().clear("music-night");
  });

  afterEach(() => {
    useBuySessionTimerStore.getState().clear("music-night");
    vi.useRealTimers();
  });

  it("keeps the earliest deadline during normal expiry sync", () => {
    const later = new Date("2026-05-21T10:10:00.000Z").getTime();
    const earlierIso = "2026-05-21T10:05:00.000Z";
    const earlier = new Date(earlierIso).getTime();

    useBuySessionTimerStore.getState().setExpiryMs("music-night", later);
    useBuySessionTimerStore.getState().syncToExpiry("music-night", earlierIso);

    expect(useBuySessionTimerStore.getState().getExpiryMs("music-night")).toBe(
      earlier,
    );
  });

  it("does not extend the timer during normal expiry sync", () => {
    const earlier = new Date("2026-05-21T10:05:00.000Z").getTime();

    useBuySessionTimerStore.getState().setExpiryMs("music-night", earlier);
    useBuySessionTimerStore
      .getState()
      .syncToExpiry("music-night", "2026-05-21T10:15:00.000Z");

    expect(useBuySessionTimerStore.getState().getExpiryMs("music-night")).toBe(
      earlier,
    );
  });

  it("extends the timer through the authoritative replacement path", () => {
    const reservationExpiry = new Date("2026-05-21T10:05:00.000Z").getTime();
    const paymentGraceExpiryIso = "2026-05-21T10:20:00.000Z";
    const paymentGraceExpiry = new Date(paymentGraceExpiryIso).getTime();

    useBuySessionTimerStore
      .getState()
      .setExpiryMs("music-night", reservationExpiry);

    expect(
      useBuySessionTimerStore
        .getState()
        .replaceWithAuthoritativeExpiry("music-night", paymentGraceExpiryIso),
    ).toBe(true);

    expect(useBuySessionTimerStore.getState().getExpiryMs("music-night")).toBe(
      paymentGraceExpiry,
    );
  });

  it("rejects invalid authoritative replacement deadlines", () => {
    useBuySessionTimerStore
      .getState()
      .setExpiryMs(
        "music-night",
        new Date("2026-05-21T10:05:00.000Z").getTime(),
      );

    expect(
      useBuySessionTimerStore
        .getState()
        .replaceWithAuthoritativeExpiry("music-night", "not-a-date"),
    ).toBe(false);

    expect(
      useBuySessionTimerStore.getState().getExpiryMs("music-night"),
    ).toBeUndefined();
  });

  it("rejects past authoritative replacement deadlines", () => {
    useBuySessionTimerStore
      .getState()
      .setExpiryMs(
        "music-night",
        new Date("2026-05-21T10:05:00.000Z").getTime(),
      );

    expect(
      useBuySessionTimerStore
        .getState()
        .replaceWithAuthoritativeExpiry(
          "music-night",
          "2026-05-21T09:59:00.000Z",
        ),
    ).toBe(false);

    expect(
      useBuySessionTimerStore.getState().getExpiryMs("music-night"),
    ).toBeUndefined();
  });
});
