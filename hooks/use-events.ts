"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getEvents,
  getEventBySlug,
  getEventDetail,
  getEventSeats,
  getEventStats,
  searchEvents,
} from "@/services/event.service";
import type { GetEventsParams } from "@/schemas/event";
import type { SearchEventsParams } from "@/schemas/event";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => [...eventKeys.all, "list"] as const,
  list: (params: Partial<GetEventsParams>) =>
    [...eventKeys.lists(), params] as const,
  search: (params: SearchEventsParams) =>
    [...eventKeys.all, "search", params] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
  slug: (slug: string) => [...eventKeys.all, "slug", slug] as const,
  seats: (eventId: string) => [...eventKeys.all, "seats", eventId] as const,
  stats: (id: string) => [...eventKeys.all, "stats", id] as const,
};

export function useEvents(
  params: Partial<GetEventsParams> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: eventKeys.list(params),
    queryFn: () => getEvents(params),
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

export function useEventSearch(params: SearchEventsParams, enabled = true) {
  return useQuery({
    queryKey: eventKeys.search(params),
    queryFn: () => searchEvents(params),
    enabled: enabled && (!!params.q || Object.keys(params).length > 2),
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
