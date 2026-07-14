import { describe, expect, it, vi } from "vitest";

import {
  continueActiveCheckout,
  getActiveCheckoutDeadline,
  isActiveCheckoutRestorable,
} from "@/lib/booking/active-checkout-actions";
import type { ActiveCheckoutReservation } from "@/schemas/reservation";

const baseCheckout: ActiveCheckoutReservation = {
  id: "10",
  eventSlug: "old-event",
  eventName: "Old Event",
  eventDate: "2026-07-01T10:00:00.000Z",
  featuredImageUrl: null,
  status: "PENDING",
  totalAmount: 100000,
  currency: "VND",
  expiresAt: "2026-07-01T10:05:00.000Z",
  effectiveExpiresAt: "2026-07-01T10:10:00.000Z",
  waitRoomToken: "token-1",
  sessionExpiresAt: "2026-07-01T10:09:00.000Z",
};

function deps(restoreBuySession = vi.fn(() => true)) {
  return {
    setReservationId: vi.fn(),
    beginBuySession: vi.fn(),
    restoreBuySession,
  };
}

describe("continueActiveCheckout", () => {
  it("uses session expiry as the pending checkout restore deadline", () => {
    expect(getActiveCheckoutDeadline(baseCheckout)).toBe(
      "2026-07-01T10:09:00.000Z",
    );
  });

  it("uses effective expiry as the payment-locked checkout restore deadline", () => {
    expect(
      getActiveCheckoutDeadline({
        ...baseCheckout,
        status: "PAYMENT_LOCKED",
      }),
    ).toBe("2026-07-01T10:10:00.000Z");
  });

  it("treats expired active checkout data as non-restorable", () => {
    expect(
      isActiveCheckoutRestorable(
        {
          ...baseCheckout,
          sessionExpiresAt: "2026-07-01T10:09:00.000Z",
        },
        new Date("2026-07-01T10:09:01.000Z").getTime(),
      ),
    ).toBe(false);
  });

  it("treats future active checkout data as restorable", () => {
    expect(
      isActiveCheckoutRestorable(
        baseCheckout,
        new Date("2026-07-01T10:08:59.000Z").getTime(),
      ),
    ).toBe(true);
  });

  it("restores payment-locked checkout deadline and routes to payment", () => {
    const d = deps();
    const result = continueActiveCheckout(
      { ...baseCheckout, status: "PAYMENT_LOCKED" },
      d,
    );

    expect(result).toEqual({
      destination: "payment",
      href: "/buy/old-event/payment",
      restoredSession: true,
    });
    expect(d.restoreBuySession).toHaveBeenCalledWith(
      "old-event",
      "2026-07-01T10:10:00.000Z",
    );
    expect(d.beginBuySession).toHaveBeenCalledWith("old-event", "token-1");
    expect(d.setReservationId).toHaveBeenLastCalledWith("10");
  });

  it("restores payment-locked checkout and routes to active provider url", () => {
    const d = deps();
    const result = continueActiveCheckout(
      {
        ...baseCheckout,
        status: "PAYMENT_LOCKED",
        paymentUrl: "https://sandbox.vnpayment.vn/payment/old-token",
      },
      d,
    );

    expect(result).toEqual({
      destination: "provider",
      href: "https://sandbox.vnpayment.vn/payment/old-token",
      restoredSession: true,
    });
    expect(d.restoreBuySession).toHaveBeenCalledWith(
      "old-event",
      "2026-07-01T10:10:00.000Z",
    );
    expect(d.beginBuySession).toHaveBeenCalledWith("old-event", "token-1");
  });

  it("restores pending checkout session and routes to payment", () => {
    const d = deps();
    const result = continueActiveCheckout(baseCheckout, d);

    expect(d.restoreBuySession).toHaveBeenCalledWith(
      "old-event",
      "2026-07-01T10:09:00.000Z",
    );
    expect(d.beginBuySession).toHaveBeenCalledWith("old-event", "token-1");
    expect(d.setReservationId).toHaveBeenLastCalledWith("10");
    expect(result).toEqual({
      destination: "payment",
      href: "/buy/old-event/payment",
      restoredSession: true,
    });
  });

  it("uses effective expiry when session expiry is absent", () => {
    const d = deps();
    continueActiveCheckout({ ...baseCheckout, sessionExpiresAt: null }, d);

    expect(d.restoreBuySession).toHaveBeenCalledWith(
      "old-event",
      "2026-07-01T10:10:00.000Z",
    );
  });

  it("routes back to event page when pending session cannot be restored", () => {
    const d = deps(vi.fn(() => false));
    const result = continueActiveCheckout(baseCheckout, d);

    expect(d.beginBuySession).not.toHaveBeenCalled();
    expect(result).toEqual({
      destination: "event",
      href: "/events/old-event",
      restoredSession: false,
    });
  });

  it("sets reservation id before attempting pending session restore", () => {
    const restoreBuySession = vi.fn(() => true);
    const d = deps(restoreBuySession);
    continueActiveCheckout(baseCheckout, d);

    expect(d.setReservationId.mock.invocationCallOrder[0]).toBeLessThan(
      restoreBuySession.mock.invocationCallOrder[0],
    );
  });
});
