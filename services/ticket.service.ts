import { PAGINATION } from "@/core/constants";
import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  CheckInResult,
  CheckInResultSchema,
  OrderListResult,
  OrderListResultSchema,
  TicketListResult,
  TicketListResultSchema,
} from "@/schemas/ticket";

export const getMyTickets = async ({
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<TicketListResult> => {
  const response = await apiClient.get("/tickets/my", {
    params: { page, limit },
  });
  return parseOrThrow(TicketListResultSchema, response);
};

export const getMyOrders = async ({
  userId,
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
}: {
  userId: string;
  page?: number;
  limit?: number;
}): Promise<OrderListResult> => {
  const response = await apiClient.get("/tickets/my/orders", {
    params: { userId, page, limit },
  });
  return parseOrThrow(OrderListResultSchema, response);
};

export const checkInTicket = async (code: string): Promise<CheckInResult> => {
  const response = await apiClient.post(`/tickets/${code}/check-in`);
  return parseOrThrow(CheckInResultSchema, response);
};
