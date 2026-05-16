import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import { MapType } from "@/schemas/seat";
import { DeliveryMethod, RecipientInfo } from "@/schemas/booking";
import type { DiscountCode, PaymentMethodId } from "@/schemas/payment";
import type { TicketType } from "@/schemas/ticket-type";
import type { Reservation } from "@/schemas/reservation";

type InitStep1Payload = {
  slug: string;
  ticketTypes: TicketType[];
  mapType: MapType;
};

type BookingState = {
  slug: string | null;
  waitRoomToken: string | null;
  waitRoomSlug: string | null;
  reservationId: string | null;
  ticketTypes: TicketType[];
  mapType: MapType;
  selectedZoneId: string | null;
  tickets: SelectedTicket[];
  selectedSeats: SelectedSeat[];

  recipient: RecipientInfo;
  deliveryMethod: DeliveryMethod;

  // ── Step 3 ──
  paymentMethodId: PaymentMethodId | null;
  discountCode: DiscountCode | null;
  billingRequested: boolean;

  initStep1: (payload: InitStep1Payload) => void;
  setWaitRoomToken: (token: string | null, slug?: string | null) => void;
  setReservationId: (id: string | null) => void;
  hydrateFromReservation: (reservation: Reservation) => void;
  reset: () => void;

  setSelectedZoneId: (id: string | null) => void;
  incrementTicket: (ticketTypeId: string, maxPerOrder: number) => void;
  decrementTicket: (ticketTypeId: string) => void;
  deleteTicket: (ticketTypeId: string) => void;
  clearTickets: () => void;

  toggleSeat: (seat: SelectedSeat, maxSeats: number) => void;
  removeSeat: (seatId: string) => void;
  clearSeats: () => void;

  updateRecipient: (fields: Partial<RecipientInfo>) => void;
  setDeliveryMethod: (method: DeliveryMethod) => void;

  setPaymentMethodId: (id: PaymentMethodId) => void;
  setDiscountCode: (code: DiscountCode | null) => void;
  setBillingRequested: (value: boolean) => void;
};

const DEFAULT_RECIPIENT: RecipientInfo = {
  fullName: "",
  email: "",
  phoneCountryCode: "+84",
  phoneNumber: "",
  idPassport: "",
};

const INITIAL_STATE = {
  slug: null,
  waitRoomToken: null as string | null,
  waitRoomSlug: null as string | null,
  reservationId: null as string | null,
  ticketTypes: [] as TicketType[],
  mapType: "zone" as MapType,
  selectedZoneId: null,
  tickets: [] as SelectedTicket[],
  selectedSeats: [] as SelectedSeat[],
  recipient: DEFAULT_RECIPIENT,
  deliveryMethod: "email_and_physical" as DeliveryMethod,
  paymentMethodId: null,
  discountCode: null,
  billingRequested: false,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // Session
      initStep1: ({ slug, ticketTypes, mapType }) =>
        set((s) => {
          const slugChanged = s.slug !== slug;
          return {
            slug,
            waitRoomToken: slugChanged
              ? s.waitRoomSlug === slug
                ? s.waitRoomToken
                : null
              : s.waitRoomToken,
            waitRoomSlug: slugChanged
              ? s.waitRoomSlug === slug
                ? s.waitRoomSlug
                : null
              : s.waitRoomSlug,
            reservationId: slugChanged ? null : s.reservationId,
            ticketTypes,
            mapType,
            selectedZoneId: slugChanged ? null : s.selectedZoneId,
            tickets: slugChanged ? [] : s.tickets,
            selectedSeats: slugChanged ? [] : s.selectedSeats,
          };
        }),

      reset: () => set(INITIAL_STATE),

      setWaitRoomToken: (token, slug) =>
        set({
          waitRoomToken: token,
          waitRoomSlug: token ? (slug ?? null) : null,
        }),
      setReservationId: (id) => set({ reservationId: id }),
      hydrateFromReservation: (reservation) =>
        set((s) => {
          const items = reservation.items ?? [];
          const selectedSeats = items
            .filter((item) => item.seatIndex != null)
            .map((item) => ({
              id: `seat-${item.seatIndex}`,
              label:
                item.seatLabel ??
                item.row ??
                (item.seatIndex != null ? `#${item.seatIndex}` : item.id),
              ticketTypeId: item.ticketTypeId,
              seatIndex: item.seatIndex!,
            }));
          const tickets = items
            .filter((item) => item.seatIndex == null)
            .map((item) => ({
              ticketTypeId: item.ticketTypeId,
              quantity: item.quantity,
            }));

          return {
            reservationId: reservation.id,
            tickets,
            selectedSeats,
            recipient: reservation.recipient
              ? {
                  ...reservation.recipient,
                  idPassport: reservation.recipient.idPassport ?? "",
                }
              : s.recipient,
            deliveryMethod:
              (reservation.deliveryMethod as BookingState["deliveryMethod"]) ??
              s.deliveryMethod,
          };
        }),

      setSelectedZoneId: (id) => set({ selectedZoneId: id }),

      incrementTicket: (ticketTypeId, maxPerOrder) =>
        set((s) => {
          const tt = s.ticketTypes.find((t) => t.id === ticketTypeId);
          if (!tt) return s;
          const available =
            tt.quantity != null && tt.soldCount != null
              ? Math.max(0, tt.quantity - tt.soldCount)
              : (tt.quantity ?? maxPerOrder);
          const existing = s.tickets.find(
            (t) => t.ticketTypeId === ticketTypeId,
          );
          if (existing) {
            if (
              existing.quantity >= maxPerOrder ||
              existing.quantity >= available
            )
              return s;
            return {
              tickets: s.tickets.map((t) =>
                t.ticketTypeId === ticketTypeId
                  ? { ...t, quantity: t.quantity + 1 }
                  : t,
              ),
            };
          }
          return { tickets: [...s.tickets, { ticketTypeId, quantity: 1 }] };
        }),

      decrementTicket: (ticketTypeId) =>
        set((s) => {
          const existing = s.tickets.find(
            (t) => t.ticketTypeId === ticketTypeId,
          );
          if (!existing || existing.quantity <= 0) return s;
          if (existing.quantity === 1)
            return {
              tickets: s.tickets.filter((t) => t.ticketTypeId !== ticketTypeId),
            };
          return {
            tickets: s.tickets.map((t) =>
              t.ticketTypeId === ticketTypeId
                ? { ...t, quantity: t.quantity - 1 }
                : t,
            ),
          };
        }),

      deleteTicket: (ticketTypeId) =>
        set((s) => ({
          tickets: s.tickets.filter((t) => t.ticketTypeId !== ticketTypeId),
        })),

      clearTickets: () => set({ tickets: [] }),

      // Seat mode
      toggleSeat: (seat, maxSeats) =>
        set((s) => {
          const exists = s.selectedSeats.find((ss) => ss.id === seat.id);
          if (exists)
            return {
              selectedSeats: s.selectedSeats.filter((ss) => ss.id !== seat.id),
            };
          if (s.selectedSeats.length >= maxSeats) return s;
          return { selectedSeats: [...s.selectedSeats, seat] };
        }),

      removeSeat: (seatId) =>
        set((s) => ({
          selectedSeats: s.selectedSeats.filter((ss) => ss.id !== seatId),
        })),

      clearSeats: () => set({ selectedSeats: [] }),

      // Step 2
      updateRecipient: (fields) =>
        set((s) => ({ recipient: { ...s.recipient, ...fields } })),

      setDeliveryMethod: (method) => set({ deliveryMethod: method }),

      // Step 3
      setPaymentMethodId: (id) => set({ paymentMethodId: id }),
      setDiscountCode: (code) => set({ discountCode: code }),
      setBillingRequested: (value) => set({ billingRequested: value }),
    }),
    {
      name: "booking",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return sessionStorage;
      }),
      partialize: ({
        slug,
        waitRoomToken,
        waitRoomSlug,
        reservationId,
        ticketTypes,
        mapType,
        selectedZoneId,
        tickets,
        selectedSeats,
        recipient,
        deliveryMethod,
        paymentMethodId,
        discountCode,
        billingRequested,
      }) => ({
        slug,
        waitRoomToken,
        waitRoomSlug,
        reservationId,
        ticketTypes,
        mapType,
        selectedZoneId,
        tickets,
        selectedSeats,
        recipient,
        deliveryMethod,
        paymentMethodId,
        discountCode,
        billingRequested,
      }),
    },
  ),
);
