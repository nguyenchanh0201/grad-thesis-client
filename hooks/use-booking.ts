"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAppError } from "@/core/error";
import { RESERVATION_POLL_INTERVAL_MS } from "@/lib/booking/config";
import { useAuthStore } from "@/lib/store/auth.store";
import {
  cancelReservation,
  createGAReservation,
  createSeatedReservation,
  getActiveCheckout,
  getReservation,
  type CreateGAReservationPayload,
  type CreateSeatedReservationPayload,
} from "@/services/reservation.service";

const UNAVAILABLE_RESERVATION_CODES = new Set([
  "RESERVATION_EXPIRED",
  "RESERVATION_NOT_PENDING",
  "RESERVATION_NOT_FOUND",
  "FORBIDDEN",
]);

export const reservationKeys = {
  all: ["reservations"] as const,
  detail: (id: string) => [...reservationKeys.all, id] as const,
  activeCheckout: (targetEventSlug: string) =>
    [...reservationKeys.all, "active-checkout", targetEventSlug] as const,
};

export function useReservation(id: string | undefined) {
  return useQuery({
    queryKey: reservationKeys.detail(id ?? ""),
    queryFn: () => getReservation(id!),
    enabled: !!id,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: RESERVATION_POLL_INTERVAL_MS,
  });
}

export function useActiveCheckout(targetEventSlug: string | undefined) {
  const user = useAuthStore((s) => s.user);
  const isAuthInitialized = useAuthStore((s) => s.isInitialized);

  return useQuery({
    queryKey: reservationKeys.activeCheckout(targetEventSlug ?? ""),
    queryFn: () => getActiveCheckout(targetEventSlug!),
    enabled: !!targetEventSlug && isAuthInitialized && !!user,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function isReservationUnavailableError(error: unknown): boolean {
  return isAppError(error) && UNAVAILABLE_RESERVATION_CODES.has(error.code);
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
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: reservationKeys.all }),
  });
}
