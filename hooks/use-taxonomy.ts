"use client";

import { useQuery } from "@tanstack/react-query";
import { getCategories, getTags, getVenues } from "@/services/taxonomy.service";
import type { GetVenuesParams } from "@/schemas/venue";

export const taxonomyKeys = {
  categories: (search?: string) => ["categories", search] as const,
  venues: (params?: GetVenuesParams) => ["venues", params] as const,
  tags: () => ["tags"] as const,
};

export function useCategories(search?: string) {
  return useQuery({
    queryKey: taxonomyKeys.categories(search),
    queryFn: () => getCategories({ search }),
    staleTime: 5 * 60_000,
  });
}

export function useVenues(params?: GetVenuesParams) {
  return useQuery({
    queryKey: taxonomyKeys.venues(params),
    queryFn: () => getVenues(params),
    staleTime: 5 * 60_000,
  });
}

export function useTags() {
  return useQuery({
    queryKey: taxonomyKeys.tags(),
    queryFn: () => getTags(),
    staleTime: 5 * 60_000,
  });
}
