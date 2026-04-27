import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import { MapType, Zone } from "../seat";

export type RecipientInfo = {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  idPassport: string;
};

export type DeliveryMethod = "email_and_physical";

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
