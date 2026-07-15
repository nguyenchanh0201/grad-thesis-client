import type { PaymentMethodId } from "@/schemas/payment";
import { RESERVATION_STATUS } from "@/schemas/reservation/reservation.schema";

type PaymentSnapshot = {
  status: "INITIATED" | "SUCCESS" | "FAILED" | "REFUNDED" | "VOIDED";
  methodId: PaymentMethodId | null;
  paymentUrl?: string | null;
} | null;

type ShouldPreparePaymentArgs = {
  reservationId: string | null | undefined;
  methodId: PaymentMethodId | null | undefined;
  reservationStatus: string | null | undefined;
  payment: PaymentSnapshot;
  preparedMethodId?: PaymentMethodId;
  isPreparing: boolean;
  prepareFailed: boolean;
};

export function hasActiveInitiatedPaymentForMethod(
  payment: PaymentSnapshot,
  methodId: PaymentMethodId | null | undefined,
) {
  return (
    payment?.status === "INITIATED" &&
    !!methodId &&
    payment.methodId === methodId
  );
}

export function shouldPreparePayment({
  reservationId,
  methodId,
  reservationStatus,
  payment,
  preparedMethodId,
  isPreparing,
  prepareFailed,
}: ShouldPreparePaymentArgs) {
  if (!reservationId || !methodId) return false;
  if (
    reservationStatus === RESERVATION_STATUS.PAID ||
    reservationStatus === RESERVATION_STATUS.CANCELLED ||
    reservationStatus === RESERVATION_STATUS.EXPIRED
  ) {
    return false;
  }
  if (hasActiveInitiatedPaymentForMethod(payment, methodId)) return false;
  if (reservationStatus === RESERVATION_STATUS.PAYMENT_LOCKED) return false;
  if (isPreparing || prepareFailed) return false;
  if (preparedMethodId === methodId) return false;

  return true;
}
