export type ZoneColorKey = "a" | "b" | "c" | "d" | "stage";

export type Zone = {
  id: string;
  label: string;
  price: number;
  colorKey: ZoneColorKey;
  available: number;
};

export type SelectedTicket = {
  zoneId: string;
  quantity: number;
};

export type TicketSelectionState = {
  selectedZoneId: string | null;
  tickets: SelectedTicket[];
  timeRemaining: number;
  timedOut: boolean;
};

export type DemoMapType = "zone" | "theater" | "stadium";
