import type { ReservationStatus } from "@/schemas/reservation";

export type ReservationPaymentAction = {
  label: string;
  href: string;
};

export function getReservationPaymentAction({
  status,
  eventSlug,
  reservationId,
}: {
  status: ReservationStatus;
  eventSlug?: string;
  reservationId: string;
}): ReservationPaymentAction | null {
  if (!eventSlug) {
    return null;
  }

  if (status === "PENDING") {
    return {
      label: "Complete Payment",
      href: `/buy/${eventSlug}/info`,
    };
  }

  if (status === "PAYMENT_LOCKED") {
    return {
      label: "View Status",
      href: `/buy/${eventSlug}/confirmation?reservationId=${encodeURIComponent(
        reservationId,
      )}`,
    };
  }

  return null;
}
