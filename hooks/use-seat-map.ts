"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPrices,
  commitEventSeatMap,
  getEventSeatMapByCode,
  getSeatMapTemplate,
  initEventSeatMap,
  listSeatMapTemplates,
  saveAsTemplate,
  saveEventSeatMapCanvas,
  type ListTemplatesParams,
  type PriceSection,
} from "@/services/seat-map.service";
import type { SeatMapCanvas } from "@/schemas/seat-map";

export const seatMapKeys = {
  templates: (params?: ListTemplatesParams) =>
    ["seat-maps", "templates", params] as const,
  template: (id: string) => ["seat-maps", "template", id] as const,
  eventCanvas: (eventCode: string) =>
    ["seat-maps", "event", eventCode] as const,
};

export function useSeatMapTemplates(params?: ListTemplatesParams) {
  return useQuery({
    queryKey: seatMapKeys.templates(params),
    queryFn: () => listSeatMapTemplates(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSeatMapTemplate(id: string | null) {
  return useQuery({
    queryKey: seatMapKeys.template(id ?? ""),
    queryFn: () => getSeatMapTemplate(id!),
    enabled: !!id,
  });
}

export function useEventSeatMapByCode(eventCode: string) {
  return useQuery({
    queryKey: seatMapKeys.eventCanvas(eventCode),
    queryFn: () => getEventSeatMapByCode(eventCode),
    retry: false,
  });
}

export function useInitEventSeatMap(eventCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seatMapId: string) => initEventSeatMap(eventCode, seatMapId),
    onSuccess: (data) => {
      qc.setQueryData(seatMapKeys.eventCanvas(eventCode), data);
    },
  });
}

export function useSaveCanvas(eventCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (canvas: SeatMapCanvas) =>
      saveEventSeatMapCanvas(eventCode, canvas),
    onSuccess: (data) => {
      qc.setQueryData(seatMapKeys.eventCanvas(eventCode), data);
    },
  });
}

export function useAssignPrices(eventCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sections: PriceSection[]) => assignPrices(eventCode, sections),
    onSuccess: (data) => {
      qc.setQueryData(seatMapKeys.eventCanvas(eventCode), data);
    },
  });
}

export function useCommitEventSeatMap(eventCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => commitEventSeatMap(eventCode),
    onSuccess: (data) => {
      qc.setQueryData(seatMapKeys.eventCanvas(eventCode), data);
    },
  });
}

export function useSaveAsTemplate(eventCode: string) {
  return useMutation({
    mutationFn: (name: string) => saveAsTemplate(eventCode, name),
  });
}
