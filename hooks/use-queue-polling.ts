"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockQueueAllowed, mockQueueWaiting } from "@/lib/mock/queue";
import {
  getQueueStatus,
  requestAccess,
  sendHeartbeat,
} from "@/services/queue.service";
import { useBookingStore } from "@/lib/store/booking";
import type {
  BackendQueueStatus,
  FrontendQueueStatus,
  WaitRoomResponse,
} from "@/schemas/queue";

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_QUEUE === "true";
const POLL_INTERVAL_MS = 25_000;

function toFrontendStatus(
  backend: BackendQueueStatus,
): Exclude<FrontendQueueStatus, "redirecting"> {
  switch (backend) {
    case "NOT_OPEN":
      return "not_open";
    case "QUEUED":
      return "waiting";
    case "ALLOWED":
      return "ready";
    case "LOST_SESSION":
      return "expired";
  }
}

function isTerminal(status: BackendQueueStatus | undefined): boolean {
  return status === "ALLOWED" || status === "LOST_SESSION";
}

export type UseQueuePollingResult = {
  status: Exclude<FrontendQueueStatus, "redirecting">;
  position: number | null;
  estimatedWait: number | null;
  isLoading: boolean;
  isError: boolean;
};

export function useQueuePolling(
  eventId: string | null,
  userId: string | null,
): UseQueuePollingResult {
  const setWaitRoomToken = useBookingStore((s) => s.setWaitRoomToken);
  const mockTickRef = useRef(0);
  const tokenRef = useRef<string | null>(null);

  // Phase 1: Join queue — fires once on mount
  const accessQuery = useQuery<WaitRoomResponse>({
    queryKey: ["queue", "access", eventId, userId],
    queryFn: async () => {
      if (USE_MOCK) return mockQueueWaiting(42);
      const res = await requestAccess({ eventId: eventId!, userId: userId! });
      return res.data;
    },
    enabled: !!eventId && !!userId,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Phase 2: Poll queue status until terminal
  const statusQuery = useQuery<WaitRoomResponse>({
    queryKey: ["queue", "status", eventId, userId],
    queryFn: async () => {
      if (USE_MOCK) {
        mockTickRef.current += 1;
        return mockTickRef.current >= 3
          ? mockQueueAllowed()
          : mockQueueWaiting(Math.max(1, 42 - (mockTickRef.current - 1) * 28));
      }
      const res = await getQueueStatus({ eventId: eventId!, userId: userId! });
      return res.data;
    },
    enabled: !!accessQuery.data && !isTerminal(accessQuery.data.status),
    refetchInterval: (query) =>
      isTerminal(query.state.data?.status) ? false : POLL_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });

  const currentData = statusQuery.data ?? accessQuery.data;

  // Sync session token into booking store when ALLOWED
  useEffect(() => {
    if (!currentData?.sessionToken || currentData.status !== "ALLOWED") return;
    tokenRef.current = currentData.sessionToken;
    setWaitRoomToken(currentData.sessionToken);
  }, [currentData, setWaitRoomToken]);

  // Fire heartbeat after each status poll while in queue
  useEffect(() => {
    if (!statusQuery.data || !tokenRef.current || !eventId || !userId) return;
    const { status } = statusQuery.data;
    if (status !== "QUEUED" && status !== "ALLOWED") return;

    sendHeartbeat({ token: tokenRef.current, eventId, userId })
      .then((hb) => {
        if (hb.data.newToken) {
          tokenRef.current = hb.data.newToken;
          setWaitRoomToken(hb.data.newToken);
        }
      })
      .catch(() => {});
  }, [statusQuery.data, eventId, userId, setWaitRoomToken]);

  const isLoading = accessQuery.isPending;
  const isError = accessQuery.isError || statusQuery.isError;

  if (isError || !currentData) {
    return {
      status: isLoading ? "waiting" : "expired",
      position: null,
      estimatedWait: null,
      isLoading,
      isError,
    };
  }

  return {
    status: toFrontendStatus(currentData.status),
    position: currentData.position ?? null,
    estimatedWait: currentData.estimatedWait ?? null,
    isLoading: false,
    isError: false,
  };
}
