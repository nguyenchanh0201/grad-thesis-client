import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import { isAppError } from "@/core/error";
import { BaseResponseSchema } from "@/schemas/api";
import {
  PaymentConfirmationResponseSchema,
  PaymentMethodsResponseSchema,
  PreparePaymentResponseSchema,
  type PaymentConfirmationResponse,
  type PaymentMethodId,
  type PaymentMethod,
  type PreparePaymentData,
} from "@/schemas/payment";
import { z } from "zod";

const VNPayUrlDataSchema = z.object({
  paymentUrl: z.string(),
  vnpParams: z.record(z.string(), z.string()).optional(),
});

const VNPayUrlResultSchema = z.union([
  BaseResponseSchema(VNPayUrlDataSchema),
  VNPayUrlDataSchema,
]);
type VNPayUrlResult = z.infer<typeof VNPayUrlDataSchema>;

export type CreateVNPayUrlPayload = {
  reservationId: string;
  waitRoomToken?: string;
};

export type PreparePaymentPayload = CreateVNPayUrlPayload & {
  methodId: PaymentMethodId;
};

export const createVNPayUrl = async (
  payload: CreateVNPayUrlPayload,
): Promise<VNPayUrlResult> => {
  try {
    const response = await apiClient.post("/payment/vnpay/create-url", payload);
    const parsed = parseOrThrow(VNPayUrlResultSchema, response);
    return "data" in parsed ? parsed.data : parsed;
  } catch (error) {
    if (isAppError(error)) {
      const rawResponse = (error.originalError as { response?: { data?: unknown } } | undefined)?.response?.data;
      console.error(
        "[createVNPayUrl] request failed",
        JSON.stringify({
          payload,
          status: error.status,
          code: error.code,
          message: error.message,
          details: (rawResponse as { error?: { details?: unknown } } | undefined)?.error?.details,
        }),
      );
    } else {
      console.error(
        "[createVNPayUrl] unexpected error",
        JSON.stringify({ payload, error }),
      );
    }
    throw error;
  }
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
