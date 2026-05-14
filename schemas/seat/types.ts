export type SelectedTicket = {
  ticketTypeId: string;
  quantity: number;
};

export type TicketSelectionState = {
  selectedZoneId: string | null;
  tickets: SelectedTicket[];
  timeRemaining: number;
  timedOut: boolean;
};
