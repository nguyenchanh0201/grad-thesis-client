import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import { BaseResponseSchema } from "@/schemas/api";
import {
  PaymentMethodsResponseSchema,
  type PaymentMethod,
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
  eventId: string;
  waitRoomToken?: string;
};

export const createVNPayUrl = async (
  payload: CreateVNPayUrlPayload,
): Promise<VNPayUrlResult> => {
  const response = await apiClient.post("/payment/vnpay/create-url", payload);
  const parsed = parseOrThrow(VNPayUrlResultSchema, response);
  return "data" in parsed ? parsed.data : parsed;
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
