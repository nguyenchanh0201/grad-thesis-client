import { describe, expect, it } from "vitest";

import {
  resolveQueueGateState,
  type ResolveQueueGateStateInput,
} from "@/lib/booking/active-checkout-gate";

const baseInput: ResolveQueueGateStateInput = {
  targetSlug: "new-event",
  isQueueIntentValid: true,
  hasUser: true,
  isCheckingActiveCheckout: false,
  isActiveCheckoutError: false,
  isCanceling: false,
  allowedAfterCancelSlug: null,
  activeCheckout: null,
};

describe("resolveQueueGateState", () => {
  it("keeps queue access disabled while active checkout status is loading", () => {
    expect(
      resolveQueueGateState({
        ...baseInput,
        isCheckingActiveCheckout: true,
      }),
    ).toBe("checking");
  });

  it("blocks queue access when another active checkout exists", () => {
    expect(
      resolveQueueGateState({
        ...baseInput,
        activeCheckout: {
          id: "10",
          eventSlug: "old-event",
          eventName: "Old Event",
          eventDate: "2026-07-01T10:00:00.000Z",
          featuredImageUrl: null,
          status: "PAYMENT_LOCKED",
          totalAmount: 100000,
          currency: "VND",
          expiresAt: "2026-07-01T10:05:00.000Z",
          effectiveExpiresAt: "2026-07-01T10:10:00.000Z",
        },
      }),
    ).toBe("blocked");
  });

  it("allows queue access after the old checkout is cancelled for this slug", () => {
    expect(
      resolveQueueGateState({
        ...baseInput,
        allowedAfterCancelSlug: "new-event",
        activeCheckout: {
          id: "10",
          eventSlug: "old-event",
          eventName: "Old Event",
          eventDate: "2026-07-01T10:00:00.000Z",
          featuredImageUrl: null,
          status: "PENDING",
          totalAmount: 100000,
          currency: "VND",
          expiresAt: "2026-07-01T10:05:00.000Z",
          effectiveExpiresAt: "2026-07-01T10:05:00.000Z",
        },
      }),
    ).toBe("allowed");
  });

  it("does not enter the queue when active checkout lookup fails", () => {
    expect(
      resolveQueueGateState({
        ...baseInput,
        isActiveCheckoutError: true,
      }),
    ).toBe("error");
  });
});
