"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyOrders, getMyTickets } from "@/services/ticket.service";
import { PAGINATION } from "@/core/constants";

export const ticketKeys = {
  all: ["tickets"] as const,
  myTickets: (userId: string, page: number) =>
    [...ticketKeys.all, "my", userId, page] as const,
  myOrders: (userId: string, page: number) =>
    [...ticketKeys.all, "orders", userId, page] as const,
};

export function useMyTickets(
  userId: string | undefined,
  page = PAGINATION.DEFAULT_PAGE,
) {
  return useQuery({
    queryKey: ticketKeys.myTickets(userId ?? "", page),
    queryFn: () => getMyTickets({ userId: userId!, page }),
    enabled: !!userId,
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
