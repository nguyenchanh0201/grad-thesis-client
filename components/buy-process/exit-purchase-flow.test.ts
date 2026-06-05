import { describe, expect, it, vi } from "vitest";

import { performBuyProcessExit } from "./exit-purchase-flow";

function makeExitDeps() {
  return {
    cancelReservation: vi.fn().mockResolvedValue(undefined),
    resetTimer: vi.fn(),
    resetBookingStore: vi.fn(),
    clearBuySessionState: vi.fn(),
    clearQueueIntentState: vi.fn(),
    redirectToEvent: vi.fn(),
  };
}

describe("performBuyProcessExit", () => {
  it("cancels an active reservation before clearing explicit leave state", async () => {
    const deps = makeExitDeps();

    await performBuyProcessExit({
      slug: "music-night",
      reservationId: "42",
      cancelActiveReservation: true,
      clearSession: true,
      ...deps,
    });

    expect(deps.cancelReservation).toHaveBeenCalledWith("42");
    expect(deps.cancelReservation.mock.invocationCallOrder[0]).toBeLessThan(
      deps.clearBuySessionState.mock.invocationCallOrder[0],
    );
    expect(deps.resetTimer).toHaveBeenCalledOnce();
    expect(deps.resetBookingStore).toHaveBeenCalledOnce();
    expect(deps.clearBuySessionState).toHaveBeenCalledWith("music-night");
    expect(deps.clearQueueIntentState).toHaveBeenCalledWith("music-night");
    expect(deps.redirectToEvent).toHaveBeenCalledWith("music-night");
  });

  it("clears explicit leave state without cancellation when no reservation exists", async () => {
    const deps = makeExitDeps();

    await performBuyProcessExit({
      slug: "music-night",
      reservationId: null,
      cancelActiveReservation: true,
      clearSession: true,
      ...deps,
    });

    expect(deps.cancelReservation).not.toHaveBeenCalled();
    expect(deps.clearBuySessionState).toHaveBeenCalledWith("music-night");
    expect(deps.redirectToEvent).toHaveBeenCalledWith("music-night");
  });

  it("does not clear local state when cancellation fails", async () => {
    const deps = makeExitDeps();
    deps.cancelReservation.mockRejectedValueOnce(new Error("cancel failed"));

    await expect(
      performBuyProcessExit({
        slug: "music-night",
        reservationId: "42",
        cancelActiveReservation: true,
        clearSession: true,
        ...deps,
      }),
    ).rejects.toThrow("cancel failed");

    expect(deps.clearBuySessionState).not.toHaveBeenCalled();
    expect(deps.resetBookingStore).not.toHaveBeenCalled();
    expect(deps.redirectToEvent).not.toHaveBeenCalled();
  });

  it("keeps timeout cleanup local and does not cancel reservations", async () => {
    const deps = makeExitDeps();

    await performBuyProcessExit({
      slug: "music-night",
      reservationId: "42",
      clearSession: true,
      ...deps,
    });

    expect(deps.cancelReservation).not.toHaveBeenCalled();
    expect(deps.clearBuySessionState).toHaveBeenCalledWith("music-night");
    expect(deps.redirectToEvent).toHaveBeenCalledWith("music-night");
  });
});
