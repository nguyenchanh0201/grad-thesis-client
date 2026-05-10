import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import { SeatMapResult, SeatMapResultSchema } from "@/schemas/seat-map";

export const getEventSeatMap = async (
  eventId: string,
): Promise<SeatMapResult> => {
  const response = await apiClient.get(`/events/${eventId}/seat-map`);
  return parseOrThrow(SeatMapResultSchema, response);
};
