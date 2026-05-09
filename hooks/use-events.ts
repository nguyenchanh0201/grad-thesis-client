"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchEvents,
  getEventBySlug,
  getEventDetail,
  getEventSeats,
  getEventStats,
} from "@/services/event.service";
import type { SearchEventsParams } from "@/schemas/event";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: Partial<SearchEventsParams>) =>
    [...eventKeys.lists(), params] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
  slug: (slug: string) => [...eventKeys.all, "slug", slug] as const,
  seats: (eventId: string) => [...eventKeys.all, "seats", eventId] as const,
  stats: (id: string) => [...eventKeys.all, "stats", id] as const,
};

export function useEvents(
  params: Partial<SearchEventsParams> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => searchEvents(params as SearchEventsParams),
    enabled,
  });
}

export function useEventBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: eventKeys.slug(slug ?? ""),
    queryFn: () => getEventBySlug(slug!),
    enabled: !!slug,
  });
}

export function useEventDetail(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? ""),
    queryFn: () => getEventDetail(id!),
    enabled: !!id,
  });
}

export function useEventSeats(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.seats(eventId ?? ""),
    queryFn: () => getEventSeats(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

export function useEventStats(id: string | undefined) {
  return useQuery({
    queryKey: eventKeys.stats(id ?? ""),
    queryFn: () => getEventStats(id!),
    enabled: !!id,
  });
}
