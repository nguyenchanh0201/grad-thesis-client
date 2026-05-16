"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchEvents,
  getEventBySlug,
  getEventDetail,
  getEventSeatsByEventCode,
  getEventStatsByEventCode,
} from "@/services/event.service";
import type { SearchEventsParams } from "@/schemas/event";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: Partial<SearchEventsParams>) =>
    [...eventKeys.lists(), params] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
  slug: (slug: string) => [...eventKeys.all, "slug", slug] as const,
  seats: (eventCode: string) => [...eventKeys.all, "seats", eventCode] as const,
  stats: (eventCode: string) => [...eventKeys.all, "stats", eventCode] as const,
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

export function useEventSeats(eventCode: string | undefined) {
  return useQuery({
    queryKey: eventKeys.seats(eventCode ?? ""),
    queryFn: () => getEventSeatsByEventCode(eventCode!),
    enabled: !!eventCode,
    staleTime: 30_000,
  });
}

export function useEventStats(eventCode: string | undefined) {
  return useQuery({
    queryKey: eventKeys.stats(eventCode ?? ""),
    queryFn: () => getEventStatsByEventCode(eventCode!),
    enabled: !!eventCode,
  });
}
