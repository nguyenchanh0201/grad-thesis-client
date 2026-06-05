import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  PaymentConfirmationResponseSchema,
  PaymentMethodsResponseSchema,
  PreparePaymentResponseSchema,
  type PaymentConfirmationResponse,
  type PaymentMethodId,
  type PaymentMethod,
  type PreparePaymentData,
} from "@/schemas/payment";

export type PreparePaymentPayload = {
  reservationId: string;
  waitRoomToken?: string;
  methodId: PaymentMethodId;
  refreshExpiredPaymentUrl?: boolean;
};

export const preparePayment = async (
  payload: PreparePaymentPayload,
): Promise<PreparePaymentData> => {
  const response = await apiClient.post("/payment/prepare", payload);
  const parsed = parseOrThrow(PreparePaymentResponseSchema, response);
  return parsed.data;
};

export const getPaymentMethodsByEventSlug = async (
  eventSlug: string,
): Promise<PaymentMethod[]> => {
  const response = await apiClient.get("/payment/vnpay/methods", {
    params: { eventSlug },
  });
  const parsed = parseOrThrow(PaymentMethodsResponseSchema, response);
  return parsed.data;
};

export const getPaymentConfirmationStatus = async (
  reservationId: string,
): Promise<PaymentConfirmationResponse["data"]> => {
  const response = await apiClient.get(
    `/payment/confirmations/${reservationId}`,
  );
  const parsed = parseOrThrow(PaymentConfirmationResponseSchema, response);
  return parsed.data;
};
