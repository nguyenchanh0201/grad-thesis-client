import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import { BaseResponseSchema } from "@/schemas/api";
import { z } from "zod";

const VNPayUrlDataSchema = z.object({
  paymentUrl: z.string(),
  vnpParams: z.record(z.string(), z.string()).optional(),
});

const VNPayUrlResultSchema = BaseResponseSchema(VNPayUrlDataSchema);
type VNPayUrlResult = z.infer<typeof VNPayUrlResultSchema>;

export type CreateVNPayUrlPayload = {
  reservationId: string;
  eventId: string;
  waitRoomToken?: string;
};

export const createVNPayUrl = async (
  payload: CreateVNPayUrlPayload,
): Promise<VNPayUrlResult> => {
  const response = await apiClient.post("/payment/vnpay/create-url", payload);
  return parseOrThrow(VNPayUrlResultSchema, response);
};
