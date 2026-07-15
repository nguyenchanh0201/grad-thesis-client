import { describe, expect, it } from "vitest";
import type { ReservationStatus } from "@/schemas/reservation";
import { getReservationPaymentAction } from "./reservation-actions";

describe("getReservationPaymentAction", () => {
  it("routes pending reservations back to checkout", () => {
    expect(
      getReservationPaymentAction({
        status: "PENDING",
        eventSlug: "music-night",
        reservationId: "42",
      }),
    ).toEqual({
      label: "Complete Payment",
      href: "/buy/music-night/info",
    });
  });

  it("routes payment locked reservations to confirmation polling", () => {
    expect(
      getReservationPaymentAction({
        status: "PAYMENT_LOCKED",
        eventSlug: "music-night",
        reservationId: "42",
      }),
    ).toEqual({
      label: "View Payment Status",
      href: "/buy/music-night/confirmation?reservationId=42",
    });
  });

  it.each<ReservationStatus>(["PAID", "CANCELLED", "EXPIRED"])(
    "returns null for terminal status %s",
    (status) => {
      expect(
        getReservationPaymentAction({
          status,
          eventSlug: "music-night",
          reservationId: "42",
        }),
      ).toBeNull();
    },
  );

  it("returns null when event slug is missing", () => {
    expect(
      getReservationPaymentAction({
        status: "PENDING",
        reservationId: "42",
      }),
    ).toBeNull();
  });
});
