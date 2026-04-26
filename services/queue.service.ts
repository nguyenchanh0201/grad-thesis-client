import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  QueueStatusResponseSchema,
  type QueueStatusResponse,
} from "@/schemas/queue";

export const getQueueStatus = async (
  entryCode: string,
): Promise<QueueStatusResponse> => {
  const response = await apiClient.get("/queue/status", {
    params: { entryCode },
  });
  return parseOrThrow(QueueStatusResponseSchema, response);
};
