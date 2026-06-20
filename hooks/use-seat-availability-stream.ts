"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSse } from "@/lib/api/sse-client";
import { eventKeys } from "@/hooks/use-events";
import {
  EventSeatsResult,
  SeatStreamPayload,
  SeatStreamPayloadSchema,
} from "@/schemas/seat";

function applySeatStreamPayload(
  current: EventSeatsResult | undefined,
  payload: SeatStreamPayload,
): EventSeatsResult {
  if (payload.type === "snapshot") {
    return {
      success: true,
      data: payload.data,
    };
  }

  if (payload.type === "resync") {
    return current ?? { success: true, data: [] };
  }

  const next: EventSeatsResult = current
    ? {
        ...current,
        data: current.data.map((section) => ({
          ...section,
          seats: section.seats.map((seat) => ({ ...seat })),
        })),
      }
    : { success: true, data: [] };

  for (const change of payload.changes) {
    const section = next.data.find(
      (item) => item.ticketTypeId === change.ticketTypeId,
    );
    const seat = section?.seats.find(
      (item) => item.seatIndex === change.seatIndex,
    );
    if (seat) {
      seat.status = change.status;
    }
  }

  return next;
}

export function useSeatAvailabilityStream(
  eventCode: string | undefined,
  enabled: boolean,
) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!eventCode || !enabled) {
      return;
    }

    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let attempt = 0;

    const connect = () => {
      void connectSse<unknown>(
        `/events/code/${encodeURIComponent(eventCode)}/seats/stream`,
        {
          signal: controller.signal,
          onOpen: () => {
            attempt = 0;
            setIsConnected(true);
          },
          onMessage: (_event, rawPayload) => {
            const payload = SeatStreamPayloadSchema.safeParse(rawPayload);
            if (!payload.success) return;
            if (payload.data.type === "resync") {
              void queryClient.invalidateQueries({
                queryKey: eventKeys.seats(eventCode),
              });
              return;
            }
            queryClient.setQueryData<EventSeatsResult>(
              eventKeys.seats(eventCode),
              (current) => applySeatStreamPayload(current, payload.data),
            );
          },
          onError: () => setIsConnected(false),
          onClose: () => {
            setIsConnected(false);
            if (stopped || controller.signal.aborted) return;
            const delay = Math.min(30_000, 1000 * 2 ** attempt);
            attempt += 1;
            reconnectTimer = setTimeout(connect, delay);
          },
        },
      );
    };

    connect();

    return () => {
      stopped = true;
      setIsConnected(false);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      controller.abort();
    };
  }, [enabled, eventCode, queryClient]);

  return { isConnected: enabled && !!eventCode && isConnected };
}
