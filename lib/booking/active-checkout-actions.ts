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
    checkout.status === "PAYMENT_LOCKED"
      ? checkout.effectiveExpiresAt
      : (checkout.sessionExpiresAt ?? checkout.effectiveExpiresAt),
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
