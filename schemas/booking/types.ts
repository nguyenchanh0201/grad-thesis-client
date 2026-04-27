import type { Zone, SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import { MapType } from "../seat";

// RecipientInfo and DeliveryMethod are defined in and exported from the store
export type { RecipientInfo, DeliveryMethod } from "@/lib/store/booking";

export type Step1Snapshot = {
  tickets: SelectedTicket[];
  selectedSeats: SelectedSeat[];
  zones: Zone[];
  mapType: MapType;
};

export type EventSummary = {
  title: string;
  image: string;
  dateLabel: string;
  venueVi: string;
  venueAddress: string;
};
