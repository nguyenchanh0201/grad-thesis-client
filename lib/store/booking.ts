import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import { MapType, Zone } from "@/schemas/seat";
import { DeliveryMethod, RecipientInfo } from "@/schemas/booking";
import type { DiscountCode, PaymentMethodId } from "@/schemas/payment";

type InitStep1Payload = {
  slug: string;
  zones: Zone[];
  mapType: MapType;
};

type BookingState = {
  slug: string | null;
  zones: Zone[];
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
  reset: () => void;

  setSelectedZoneId: (id: string | null) => void;
  incrementTicket: (zoneId: string, maxPerZone: number) => void;
  decrementTicket: (zoneId: string) => void;
  deleteTicket: (zoneId: string) => void;
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
  zones: [] as Zone[],
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
      initStep1: ({ slug, zones, mapType }) =>
        set((s) => {
          const slugChanged = s.slug !== slug;
          return {
            slug,
            zones,
            mapType,
            selectedZoneId: slugChanged ? null : s.selectedZoneId,
            tickets: slugChanged ? [] : s.tickets,
            selectedSeats: slugChanged ? [] : s.selectedSeats,
          };
        }),

      reset: () => set(INITIAL_STATE),

      // Zone mode
      setSelectedZoneId: (id) => set({ selectedZoneId: id }),

      incrementTicket: (zoneId, maxPerZone) =>
        set((s) => {
          const zone = s.zones.find((z) => z.id === zoneId);
          if (!zone) return s;
          const existing = s.tickets.find((t) => t.zoneId === zoneId);
          if (existing) {
            if (
              existing.quantity >= maxPerZone ||
              existing.quantity >= zone.available
            )
              return s;
            return {
              tickets: s.tickets.map((t) =>
                t.zoneId === zoneId ? { ...t, quantity: t.quantity + 1 } : t,
              ),
            };
          }
          return { tickets: [...s.tickets, { zoneId, quantity: 1 }] };
        }),

      decrementTicket: (zoneId) =>
        set((s) => {
          const existing = s.tickets.find((t) => t.zoneId === zoneId);
          if (!existing || existing.quantity <= 0) return s;
          if (existing.quantity === 1)
            return { tickets: s.tickets.filter((t) => t.zoneId !== zoneId) };
          return {
            tickets: s.tickets.map((t) =>
              t.zoneId === zoneId ? { ...t, quantity: t.quantity - 1 } : t,
            ),
          };
        }),

      deleteTicket: (zoneId) =>
        set((s) => ({ tickets: s.tickets.filter((t) => t.zoneId !== zoneId) })),

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
        zones,
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
        zones,
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
