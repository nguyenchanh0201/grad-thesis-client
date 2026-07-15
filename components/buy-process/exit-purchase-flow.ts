type ExitPurchaseFlowArgs = {
  slug: string;
  reservationId?: string | null;
  cancelActiveReservation?: boolean;
  clearSession?: boolean;
  redirectTo?: string;
  cancelReservation: (reservationId: string) => Promise<unknown>;
  resetTimer: () => void;
  resetBookingStore: () => void;
  clearBuySessionState: (slug: string) => void;
  clearQueueIntentState: (slug: string) => void;
  redirectToEvent: (slug: string) => void;
  redirectToHref?: (href: string) => void;
};

export async function performBuyProcessExit({
  slug,
  reservationId,
  cancelActiveReservation = false,
  clearSession = false,
  redirectTo,
  cancelReservation,
  resetTimer,
  resetBookingStore,
  clearBuySessionState,
  clearQueueIntentState,
  redirectToEvent,
  redirectToHref,
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
  if (redirectTo && redirectToHref) {
    redirectToHref(redirectTo);
    return;
  }
  redirectToEvent(slug);
}
