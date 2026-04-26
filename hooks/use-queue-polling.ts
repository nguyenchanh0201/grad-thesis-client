"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { mockQueueAdmitted, mockQueueWaiting } from "@/lib/mock/queue";
import { getQueueStatus } from "@/services/queue.service";
import type {
  BackendQueueStatus,
  FrontendQueueStatus,
  QueueEventData,
  QueueStatusData,
} from "@/schemas/queue";

const USE_MOCK = process.env.NEXT_PUBLIC_MOCK_QUEUE === "true";
const POLL_INTERVAL_MS = 4000;
const TERMINAL_STATUSES: BackendQueueStatus[] = ["ADMITTED", "LOST_SESSION"];

function toFrontendStatus(
  backend: BackendQueueStatus,
): Exclude<FrontendQueueStatus, "redirecting"> {
  switch (backend) {
    case "NOT_OPEN":
      return "not_open";
    case "QUEUEING":
      return "waiting";
    case "ADMITTED":
      return "ready";
    case "LOST_SESSION":
      return "expired";
  }
}

export type UseQueuePollingResult = {
  status: Exclude<FrontendQueueStatus, "redirecting">;
  position: number | null;
  estimatedWaitSeconds: number | null;
  purchaseUrl: string | null;
  eventData: QueueEventData | null;
  isLoading: boolean;
  isError: boolean;
};

export function useQueuePolling(
  entryCode: string | null,
): UseQueuePollingResult {
  const mockTickRef = useRef(0);

  const { data, isLoading, isError } = useQuery<QueueStatusData>({
    queryKey: ["queue-status", entryCode],
    queryFn: async (): Promise<QueueStatusData> => {
      if (USE_MOCK) {
        mockTickRef.current += 1;
        // Simulate: tick 1 → position 42, tick 2 → position 14, tick 3+ → admitted
        if (mockTickRef.current >= 3) return mockQueueAdmitted();
        return mockQueueWaiting(
          Math.max(1, 42 - (mockTickRef.current - 1) * 28),
        );
      }
      if (!entryCode) throw new Error("No entryCode");
      const response = await getQueueStatus(entryCode);
      return response.data;
    },
    enabled: USE_MOCK || !!entryCode,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && TERMINAL_STATUSES.includes(status)) return false;
      return POLL_INTERVAL_MS;
    },
    // axiosRetry in api-client handles HTTP-level retries; disable RQ retries to avoid double retry
    retry: false,
  });

  if (isError) {
    return {
      status: "expired",
      position: null,
      estimatedWaitSeconds: null,
      purchaseUrl: null,
      eventData: null,
      isLoading: false,
      isError: true,
    };
  }

  return {
    status: data ? toFrontendStatus(data.status) : "waiting",
    position: data?.position ?? null,
    estimatedWaitSeconds: data?.estimatedWaitSeconds ?? null,
    purchaseUrl: data?.purchaseUrl ?? null,
    eventData: data?.event ?? null,
    isLoading,
    isError: false,
  };
}
