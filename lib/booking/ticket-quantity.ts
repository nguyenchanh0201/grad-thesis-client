type SelectedTicket = {
  ticketTypeId: string;
  quantity: number;
};

type TicketTypeLike = {
  id: string;
  quantity?: number;
  soldCount?: number;
};

export function getZoneAvailableQuantity(
  ticketType: TicketTypeLike,
  fallbackMaxPerOrder: number,
) {
  if (
    ticketType.quantity != null &&
    Number.isFinite(ticketType.quantity) &&
    ticketType.soldCount != null &&
    Number.isFinite(ticketType.soldCount)
  ) {
    return Math.max(0, ticketType.quantity - ticketType.soldCount);
  }

  if (ticketType.quantity != null && Number.isFinite(ticketType.quantity)) {
    return Math.max(0, ticketType.quantity);
  }

  return Math.max(1, fallbackMaxPerOrder);
}

export function incrementZoneTickets(payload: {
  tickets: SelectedTicket[];
  ticketTypes: TicketTypeLike[];
  ticketTypeId: string;
  maxPerOrder: number;
}): SelectedTicket[] {
  const { tickets, ticketTypes, ticketTypeId, maxPerOrder } = payload;
  const cappedMaxPerOrder = Math.max(1, maxPerOrder);
  const totalSelected = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  if (totalSelected >= cappedMaxPerOrder) return tickets;

  const ticketType = ticketTypes.find((ticket) => ticket.id === ticketTypeId);
  if (!ticketType) return tickets;

  const available = getZoneAvailableQuantity(ticketType, cappedMaxPerOrder);
  if (available <= 0) return tickets;

  const existing = tickets.find((ticket) => ticket.ticketTypeId === ticketTypeId);
  if (existing) {
    if (
      existing.quantity >= cappedMaxPerOrder ||
      existing.quantity >= available
    ) {
      return tickets;
    }

    return tickets.map((ticket) =>
      ticket.ticketTypeId === ticketTypeId
        ? { ...ticket, quantity: ticket.quantity + 1 }
        : ticket,
    );
  }

  return [...tickets, { ticketTypeId, quantity: 1 }];
}

export function decrementZoneTickets(payload: {
  tickets: SelectedTicket[];
  ticketTypeId: string;
}): SelectedTicket[] {
  const { tickets, ticketTypeId } = payload;
  const existing = tickets.find((ticket) => ticket.ticketTypeId === ticketTypeId);
  if (!existing || existing.quantity <= 0) return tickets;

  if (existing.quantity === 1) {
    return tickets.filter((ticket) => ticket.ticketTypeId !== ticketTypeId);
  }

  return tickets.map((ticket) =>
    ticket.ticketTypeId === ticketTypeId
      ? { ...ticket, quantity: ticket.quantity - 1 }
      : ticket,
  );
}
