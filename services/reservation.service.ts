import { PAGINATION } from "@/core/constants";
import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  AvailableVoucherListResult,
  AvailableVoucherListResultSchema,
  ApplyReservationVoucherResult,
  ApplyReservationVoucherResultSchema,
  CreateReservationResponseSchema,
  ReservationListResult,
  ReservationListResultSchema,
  ReservationResult,
  ReservationResultSchema,
  UpdateReservationRecipientResult,
  UpdateReservationRecipientResultSchema,
} from "@/schemas/reservation";

export type CreateSeatedReservationPayload = {
  eventSlug: string;
  seatIndices: number[];
  waitRoomToken?: string;
};

export type GAReservationItem = {
  ticketTypeId: string;
  quantity: number;
};

export type CreateGAReservationPayload = {
  eventSlug: string;
  items: GAReservationItem[];
  waitRoomToken?: string;
};

export type UpdateReservationRecipientPayload = {
  recipient: {
    fullName: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    idPassport?: string | null;
  };
  deliveryMethod: string;
};

// BE returns { status: boolean, reservationId: string }. Follow up with GET for full detail.
async function fetchReservationDetail(id: string): Promise<ReservationResult> {
  const response = await apiClient.get(`/reservations/${id}`);
  return parseOrThrow(ReservationResultSchema, response);
}

export const createSeatedReservation = async (
  payload: CreateSeatedReservationPayload,
): Promise<ReservationResult> => {
  const createResponse = await apiClient.post("/reservations/seated", payload);
  const { reservationId } = parseOrThrow(
    CreateReservationResponseSchema,
    createResponse,
  );
  return fetchReservationDetail(reservationId);
};

export const createGAReservation = async (
  payload: CreateGAReservationPayload,
): Promise<ReservationResult> => {
  const createResponse = await apiClient.post("/reservations/ga", payload);
  const { reservationId } = parseOrThrow(
    CreateReservationResponseSchema,
    createResponse,
  );
  return fetchReservationDetail(reservationId);
};

export const getMyReservations = async ({
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<ReservationListResult> => {
  const response = await apiClient.get("/reservations/my", {
    params: { page, limit },
  });
  return parseOrThrow(ReservationListResultSchema, response);
};

export const getReservation = async (
  id: string,
): Promise<ReservationResult> => {
  const response = await apiClient.get(`/reservations/${id}`);
  return parseOrThrow(ReservationResultSchema, response);
};

export const updateReservationRecipient = async (
  id: string,
  payload: UpdateReservationRecipientPayload,
): Promise<UpdateReservationRecipientResult> => {
  const response = await apiClient.patch(
    `/reservations/${id}/recipient`,
    payload,
  );
  return parseOrThrow(UpdateReservationRecipientResultSchema, response);
};

export const cancelReservation = async (
  id: string,
): Promise<ReservationResult> => {
  const response = await apiClient.post(`/reservations/${id}/cancel`);
  return parseOrThrow(ReservationResultSchema, response);
};

export const applyReservationVoucher = async (
  id: string,
  code: string,
): Promise<ApplyReservationVoucherResult> => {
  const response = await apiClient.post(`/reservations/${id}/voucher`, {
    code,
  });
  return parseOrThrow(ApplyReservationVoucherResultSchema, response);
};

export const removeReservationVoucher = async (
  id: string,
): Promise<ApplyReservationVoucherResult> => {
  const response = await apiClient.post(`/reservations/${id}/voucher/remove`);
  return parseOrThrow(ApplyReservationVoucherResultSchema, response);
};

export const getAvailableVouchers = async (
  eventSlug?: string,
  page?: number,
  limit?: number,
): Promise<AvailableVoucherListResult> => {
  const response = await apiClient.get("/vouchers", {
    params: {
      ...(eventSlug ? { eventSlug } : {}),
      ...(page ? { page } : {}),
      ...(limit ? { limit } : {}),
    },
  });
  return parseOrThrow(AvailableVoucherListResultSchema, response);
};

export const getMyVouchers = async ({
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<AvailableVoucherListResult> => {
  const response = await apiClient.get("/vouchers/my", {
    params: { page, limit },
  });
  return parseOrThrow(AvailableVoucherListResultSchema, response);
};
