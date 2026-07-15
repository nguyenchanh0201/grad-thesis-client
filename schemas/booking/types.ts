import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import { MapType } from "../seat";
import type { TicketType } from "@/schemas/ticket-type";

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
  ticketTypes: TicketType[];
  mapType: MapType;
};

export type EventSummary = {
  title: string;
  image: string;
  dateLabel: string;
  venueVi: string;
  venueAddress: string;
};
