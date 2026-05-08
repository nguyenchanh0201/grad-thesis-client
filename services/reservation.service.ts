import { PAGINATION } from "@/core/constants";
import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  ReservationListResult,
  ReservationListResultSchema,
  ReservationResult,
  ReservationResultSchema,
} from "@/schemas/reservation";

export type CreateSeatedReservationPayload = {
  eventId: string;
  userId: string;
  seatIndices: number[];
  waitRoomToken?: string;
};

export type GAReservationItem = {
  ticketTypeId: string;
  quantity: number;
};

export type CreateGAReservationPayload = {
  userId: string;
  eventId: string;
  items: GAReservationItem[];
  waitRoomToken?: string;
};

export const createSeatedReservation = async (
  payload: CreateSeatedReservationPayload,
): Promise<ReservationResult> => {
  const response = await apiClient.post("/reservations/seated", payload);
  return parseOrThrow(ReservationResultSchema, response);
};

export const createGAReservation = async (
  payload: CreateGAReservationPayload,
): Promise<ReservationResult> => {
  const response = await apiClient.post("/reservations/ga", payload);
  return parseOrThrow(ReservationResultSchema, response);
};

export const getMyReservations = async ({
  userId,
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
}: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<ReservationListResult> => {
  const response = await apiClient.get("/reservations/my", {
    params: { userId, page, limit },
  });
  return parseOrThrow(ReservationListResultSchema, response);
};

export const getReservation = async (
  id: string,
  userId: string,
): Promise<ReservationResult> => {
  const response = await apiClient.get(`/reservations/${id}`, {
    params: { userId },
  });
  return parseOrThrow(ReservationResultSchema, response);
};

export const cancelReservation = async (
  id: string,
  userId: string,
): Promise<ReservationResult> => {
  const response = await apiClient.post(`/reservations/${id}/cancel`, null, {
    params: { userId },
  });
  return parseOrThrow(ReservationResultSchema, response);
};
