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

export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: reservationKeys.detail(id ?? ""),
    queryFn: () => getReservation(id!),
    enabled: !!id,
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

// userId is sent via x-mock-user-id header — no param needed here
export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}
