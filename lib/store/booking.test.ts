import { beforeEach, describe, expect, it } from "vitest";

import type { TicketType } from "@/schemas/ticket-type";
import { useBookingStore } from "@/lib/store/booking";

const ticketType: TicketType = {
  id: "ticket-type-1",
  eventId: "event-1",
  name: "General Admission",
  description: undefined,
  price: 100_000,
  currency: "VND",
  quantity: 10,
  soldCount: 0,
};

describe("booking store buy session state", () => {
  beforeEach(() => {
    localStorage.clear();
    useBookingStore.getState().reset();
  });

  it("clears stale same-event checkout state when a fresh buy session begins", () => {
    const store = useBookingStore.getState();

    store.beginBuySession("music-night", "old-token");
    store.initStep1({
      slug: "music-night",
      ticketTypes: [ticketType],
      mapType: "zone",
    });
    store.incrementTicket(ticketType.id, 8);
    store.setReservationId("expired-reservation");
    store.updateRecipient({
      fullName: "Old Buyer",
      email: "old@example.com",
      phoneNumber: "0900000000",
    });
    store.setPaymentMethodId("vnpay");

    useBookingStore.getState().beginBuySession("music-night", "new-token");

    expect(useBookingStore.getState()).toMatchObject({
      slug: "music-night",
      waitRoomToken: "new-token",
      waitRoomSlug: "music-night",
      reservationId: null,
      ticketTypes: [],
      selectedZoneId: null,
      tickets: [],
      selectedSeats: [],
      paymentMethodId: null,
      discountCode: null,
      billingRequested: false,
    });
    expect(useBookingStore.getState().recipient).toMatchObject({
      fullName: "",
      email: "",
      phoneCountryCode: "+84",
      phoneNumber: "",
      idPassport: "",
    });
  });

  it("preserves an existing same-event waitroom token when the queue page does not pass one", () => {
    const store = useBookingStore.getState();

    store.setWaitRoomToken("admitted-token", "music-night");
    store.setReservationId("expired-reservation");

    store.beginBuySession("music-night");

    expect(useBookingStore.getState()).toMatchObject({
      slug: "music-night",
      waitRoomToken: "admitted-token",
      waitRoomSlug: "music-night",
      reservationId: null,
    });
  });

  it("does not carry a token from a different event into a new buy session", () => {
    const store = useBookingStore.getState();

    store.setWaitRoomToken("other-token", "other-event");

    store.beginBuySession("music-night");

    expect(useBookingStore.getState()).toMatchObject({
      slug: "music-night",
      waitRoomToken: null,
      waitRoomSlug: null,
    });
  });
});
