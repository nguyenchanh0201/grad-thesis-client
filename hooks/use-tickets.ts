"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyOrders, getMyTickets } from "@/services/ticket.service";
import { PAGINATION } from "@/core/constants";
import { getMyVouchers } from "@/services/reservation.service";

export const ticketKeys = {
  all: ["tickets"] as const,
  myTickets: (page: number) => [...ticketKeys.all, "my", page] as const,
  myVouchers: (page: number, limit: number) =>
    [...ticketKeys.all, "vouchers", page, limit] as const,
  myOrders: (userId: string, page: number) =>
    [...ticketKeys.all, "orders", userId, page] as const,
};

export function useMyTickets(page = PAGINATION.DEFAULT_PAGE) {
  return useQuery({
    queryKey: ticketKeys.myTickets(page),
    queryFn: () => getMyTickets({ page }),
  });
}

export function useMyVouchers(
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.DEFAULT_LIMIT,
) {
  return useQuery({
    queryKey: ticketKeys.myVouchers(page, limit),
    queryFn: () => getMyVouchers({ page, limit }),
  });
}

export function useMyOrders(
  userId: string | undefined,
  page = PAGINATION.DEFAULT_PAGE,
) {
  return useQuery({
    queryKey: ticketKeys.myOrders(userId ?? "", page),
    queryFn: () => getMyOrders({ userId: userId!, page }),
    enabled: !!userId,
  });
}
