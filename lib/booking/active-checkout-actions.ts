import { setBuySession } from "@/lib/booking/buy-session";
import type { ActiveCheckoutReservation } from "@/schemas/reservation";

export type ContinueActiveCheckoutResult =
  | {
      destination: "provider";
      href: string;
      restoredSession: true;
    }
  | {
      destination: "payment";
      href: string;
      restoredSession: true;
    }
  | {
      destination: "event";
      href: string;
      restoredSession: false;
    };

export function getActiveCheckoutDeadline(
  checkout: ActiveCheckoutReservation,
): string {
  return checkout.status === "PAYMENT_LOCKED"
    ? checkout.effectiveExpiresAt
    : (checkout.sessionExpiresAt ?? checkout.effectiveExpiresAt);
}

export function isActiveCheckoutRestorable(
  checkout: ActiveCheckoutReservation,
  nowMs = Date.now(),
): boolean {
  const deadlineMs = new Date(getActiveCheckoutDeadline(checkout)).getTime();
  return Number.isFinite(deadlineMs) && deadlineMs > nowMs;
}

export function continueActiveCheckout(
  checkout: ActiveCheckoutReservation,
  deps: {
    setReservationId: (id: string) => void;
    beginBuySession: (slug: string, waitRoomToken?: string | null) => void;
    restoreBuySession?: typeof setBuySession;
  },
): ContinueActiveCheckoutResult {
  deps.setReservationId(checkout.id);

  const restoreBuySession = deps.restoreBuySession ?? setBuySession;
  const restored = restoreBuySession(
    checkout.eventSlug,
    getActiveCheckoutDeadline(checkout),
  );

  if (restored) {
    deps.beginBuySession(checkout.eventSlug, checkout.waitRoomToken);
    deps.setReservationId(checkout.id);
    if (checkout.status === "PAYMENT_LOCKED" && checkout.paymentUrl) {
      return {
        destination: "provider",
        href: checkout.paymentUrl,
        restoredSession: true,
      };
    }
    return {
      destination: "payment",
      href: `/buy/${checkout.eventSlug}/payment`,
      restoredSession: true,
    };
  }

  return {
    destination: "event",
    href: `/events/${checkout.eventSlug}`,
    restoredSession: false,
  };
}
