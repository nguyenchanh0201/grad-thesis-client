"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyOrders, getMyTickets } from "@/services/ticket.service";
import { PAGINATION } from "@/core/constants";
import {
  getMyReservations,
  getMyVouchers,
} from "@/services/reservation.service";

const FETCH_ALL_LIMIT = 100;

export const ticketKeys = {
  all: ["tickets"] as const,
  myTickets: () => [...ticketKeys.all, "my-all"] as const,
  myVouchers: (page: number, limit: number) =>
    [...ticketKeys.all, "vouchers", page, limit] as const,
  myOrders: (userId: string, page: number) =>
    [...ticketKeys.all, "orders", userId, page] as const,
  myReservations: () => ["reservations", "my-all"] as const,
};

export function useMyTickets() {
  return useQuery({
    queryKey: ticketKeys.myTickets(),
    queryFn: () => getMyTickets({ page: 1, limit: FETCH_ALL_LIMIT }),
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

export function useMyReservations() {
  return useQuery({
    queryKey: ticketKeys.myReservations(),
    queryFn: () => getMyReservations({ page: 1, limit: FETCH_ALL_LIMIT }),
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
