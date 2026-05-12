import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  EventSeatMapResult,
  EventSeatMapResultSchema,
  SeatMapCanvas,
  SeatMapResult,
  SeatMapResultSchema,
  SeatMapListResult,
  SeatMapListResultSchema,
} from "@/schemas/seat-map";

// ─── Public buyer endpoint ────────────────────────────────────────────────────
export const getEventSeatMap = async (
  eventId: string,
): Promise<EventSeatMapResult> => {
  const response = await apiClient.get(`/events/${eventId}/seat-map`);
  return parseOrThrow(EventSeatMapResultSchema, response);
};

// ─── Template management ──────────────────────────────────────────────────────
export type ListTemplatesParams = {
  page?: number;
  limit?: number;
  venueId?: string;
  search?: string;
  isSystem?: boolean;
};

export const listSeatMapTemplates = async (
  params?: ListTemplatesParams,
): Promise<SeatMapListResult> => {
  const response = await apiClient.get("/seat-map", { params });
  return parseOrThrow(SeatMapListResultSchema, response);
};

export const getSeatMapTemplate = async (
  id: string,
): Promise<SeatMapResult> => {
  const response = await apiClient.get(`/seat-map/${id}`);
  return parseOrThrow(SeatMapResultSchema, response);
};

// ─── Organizer event seat map (all routes use eventCode) ─────────────────────
export const initEventSeatMap = async (
  eventCode: string,
  seatMapId: string,
): Promise<SeatMapResult> => {
  const response = await apiClient.post(
    `/events/code/${eventCode}/seat-map/init`,
    { seatMapId },
  );
  return parseOrThrow(SeatMapResultSchema, response);
};

export const getEventSeatMapByCode = async (
  eventCode: string,
): Promise<SeatMapResult> => {
  const response = await apiClient.get(`/events/code/${eventCode}/seat-map`);
  return parseOrThrow(SeatMapResultSchema, response);
};

export const saveEventSeatMapCanvas = async (
  eventCode: string,
  canvas: SeatMapCanvas,
): Promise<SeatMapResult> => {
  const response = await apiClient.put(
    `/events/code/${eventCode}/seat-map/canvas`,
    { canvas },
  );
  return parseOrThrow(SeatMapResultSchema, response);
};

export type PriceSection = {
  elementId: string;
  price: string;
  currency: string;
};

export const assignPrices = async (
  eventCode: string,
  sections: PriceSection[],
): Promise<SeatMapResult> => {
  const response = await apiClient.patch(
    `/events/code/${eventCode}/seat-map/prices`,
    { sections },
  );
  return parseOrThrow(SeatMapResultSchema, response);
};

export const commitEventSeatMap = async (
  eventCode: string,
): Promise<SeatMapResult> => {
  const response = await apiClient.post(
    `/events/code/${eventCode}/seat-map/commit`,
  );
  return parseOrThrow(SeatMapResultSchema, response);
};

export const saveAsTemplate = async (
  eventCode: string,
  name: string,
): Promise<SeatMapResult> => {
  const response = await apiClient.post(
    `/events/code/${eventCode}/seat-map/save-as-template`,
    { name },
  );
  return parseOrThrow(SeatMapResultSchema, response);
};
