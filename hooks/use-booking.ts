"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelReservation,
  createGAReservation,
  createSeatedReservation,
  getReservation,
  type CreateGAReservationPayload,
  type CreateSeatedReservationPayload,
} from "@/services/reservation.service";

export const reservationKeys = {
  all: ["reservations"] as const,
  detail: (id: string) => [...reservationKeys.all, id] as const,
};

export function useReservation(id: string | undefined, userId: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id ?? ""),
    queryFn: () => getReservation(id!, userId),
    enabled: !!id && !!userId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      // Stop polling once reservation is no longer pending
      return status === 0 ? 10_000 : false;
    },
    retry: false,
  });
}

export function useCreateSeatedReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSeatedReservationPayload) =>
      createSeatedReservation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}

export function useCreateGAReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGAReservationPayload) =>
      createGAReservation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      cancelReservation(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}
