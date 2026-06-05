type ExitPurchaseFlowArgs = {
  slug: string;
  reservationId?: string | null;
  cancelActiveReservation?: boolean;
  clearSession?: boolean;
  cancelReservation: (reservationId: string) => Promise<unknown>;
  resetTimer: () => void;
  resetBookingStore: () => void;
  clearBuySessionState: (slug: string) => void;
  clearQueueIntentState: (slug: string) => void;
  redirectToEvent: (slug: string) => void;
};

export async function performBuyProcessExit({
  slug,
  reservationId,
  cancelActiveReservation = false,
  clearSession = false,
  cancelReservation,
  resetTimer,
  resetBookingStore,
  clearBuySessionState,
  clearQueueIntentState,
  redirectToEvent,
}: ExitPurchaseFlowArgs) {
  if (cancelActiveReservation && reservationId) {
    await cancelReservation(reservationId);
  }

  resetTimer();
  resetBookingStore();
  if (clearSession) {
    clearBuySessionState(slug);
  }
  clearQueueIntentState(slug);
  redirectToEvent(slug);
}
