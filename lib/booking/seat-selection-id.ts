export function toSeatSelectionId(ticketTypeId: string, seatIndex: number) {
  return `${ticketTypeId}:${seatIndex}`;
}
