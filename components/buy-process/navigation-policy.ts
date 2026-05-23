export type CheckoutPaymentStatus =
  | "INITIATED"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "VOIDED"
  | null
  | undefined;

export function isNavigationFrozen(paymentStatus: CheckoutPaymentStatus): boolean {
  return paymentStatus !== null && paymentStatus !== undefined;
}

export function shouldRedirectToGatewayStep(
  currentStep: number,
  paymentStatus: CheckoutPaymentStatus,
  isConfirmationStep: boolean,
): boolean {
  return !isConfirmationStep && currentStep <= 3 && isNavigationFrozen(paymentStatus);
}
