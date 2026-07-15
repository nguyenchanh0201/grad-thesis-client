"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getQueueStatus,
  requestAccess,
  sendQueuePresence,
  sendHeartbeat,
} from "@/services/queue.service";
import { useBookingStore } from "@/lib/store/booking";
import { useUserActivity } from "@/lib/booking/user-activity";
import { connectSse } from "@/lib/api/sse-client";
import { ApiError } from "@/core/error";
import type {
  BackendQueueStatus,
  FrontendQueueStatus,
  WaitRoomResponse,
} from "@/schemas/queue";
import { QueueStreamPayloadSchema } from "@/schemas/queue";

const POLL_INTERVAL_MS = 25_000;
const STREAM_PRESENCE_INTERVAL_MS = 25_000;

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

function isTerminal(status: BackendQueueStatus | undefined): boolean {
  return status === "ADMITTED" || status === "LOST_SESSION";
}

export type UseQueuePollingResult = {
  status: Exclude<FrontendQueueStatus, "redirecting">;
  token: string | null;
  position: number | null;
  queueSize: number | null;
  sessionExpiresAt: string | null;
  isLoading: boolean;
  isError: boolean;
  isIdle: boolean;
  lastActivityAt: string;
};

export function useQueuePolling(
  slug: string | null,
  userId: string | null,
): UseQueuePollingResult {
  const setWaitRoomToken = useBookingStore((s) => s.setWaitRoomToken);
  const queryClient = useQueryClient();
  const tokenRef = useRef<string | null>(null);
  const heartbeatTokenRef = useRef<string | null>(null);
  const { isIdle, lastActivityAt } = useUserActivity();
  const [heartbeatSessionExpiresAt, setHeartbeatSessionExpiresAt] = useState<
    string | null
  >(null);
  const [streamData, setStreamData] = useState<WaitRoomResponse | null>(null);
  const [isStreamConnected, setIsStreamConnected] = useState(false);

  // Phase 1: Join queue — fires once on mount
  const accessQuery = useQuery<WaitRoomResponse>({
    queryKey: ["queue", "access", slug, userId],
    queryFn: async () => {
      try {
        return await requestAccess({ slug: slug!, lastActivityAt });
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          return { status: "NOT_OPEN" } satisfies WaitRoomResponse;
        }
        throw err;
      }
    },
    enabled: !!slug && !!userId && !isIdle,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Phase 2: Poll queue status until terminal
  const statusQuery = useQuery<WaitRoomResponse>({
    queryKey: ["queue", "status", slug, userId],
    queryFn: async () => {
      try {
        return await getQueueStatus({ slug: slug!, lastActivityAt });
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          return { status: "NOT_OPEN" } satisfies WaitRoomResponse;
        }
        throw err;
      }
    },
    enabled:
      !!accessQuery.data &&
      !isTerminal(accessQuery.data.status) &&
      !isIdle &&
      !isStreamConnected,
    gcTime: 0,
    refetchInterval: (query) =>
      isTerminal(query.state.data?.status) ? false : POLL_INTERVAL_MS,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (
      !slug ||
      !userId ||
      isIdle ||
      !accessQuery.data ||
      isTerminal(accessQuery.data.status)
    ) {
      return;
    }

    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    let attempt = 0;

    const connect = () => {
      void connectSse<unknown>(
        `/tickets/queue-stream?slug=${encodeURIComponent(slug)}`,
        {
          signal: controller.signal,
          onOpen: () => {
            attempt = 0;
            setIsStreamConnected(true);
          },
          onMessage: (_event, rawPayload) => {
            const payload = QueueStreamPayloadSchema.safeParse(rawPayload);
            if (!payload.success) return;

            if (payload.data.type === "admitted") {
              setStreamData({
                status: "ADMITTED",
                token: payload.data.token,
                sessionExpiresAt: payload.data.sessionExpiresAt,
              });
              return;
            }

            if (payload.data.type === "lost-session") {
              setStreamData({ status: "LOST_SESSION" });
              return;
            }

            if (payload.data.type === "queue-status") {
              setStreamData({
                status: payload.data.status ?? "QUEUEING",
                position: payload.data.position,
                token: payload.data.token,
                sessionExpiresAt: payload.data.sessionExpiresAt,
              });
            }
          },
          onError: () => setIsStreamConnected(false),
          onClose: () => {
            setIsStreamConnected(false);
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
      setIsStreamConnected(false);
      setStreamData(null);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      controller.abort();
    };
  }, [accessQuery.data, isIdle, slug, userId]);

  const currentData = streamData ?? statusQuery.data ?? accessQuery.data;

  useEffect(() => {
    if (!slug || !userId || !isStreamConnected || isIdle) return;
    if (currentData?.status !== "QUEUEING") return;

    const intervalId = window.setInterval(() => {
      sendQueuePresence({ slug, lastActivityAt }).catch(() => {});
    }, STREAM_PRESENCE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [
    currentData?.status,
    isIdle,
    isStreamConnected,
    lastActivityAt,
    slug,
    userId,
  ]);

  // Sync session token into ref + booking store when ADMITTED
  useEffect(() => {
    if (!slug || !currentData?.token || currentData.status !== "ADMITTED") {
      return;
    }
    tokenRef.current = currentData.token;
    setWaitRoomToken(currentData.token, slug);
  }, [currentData, setWaitRoomToken, slug]);

  // A user can be admitted by the initial requestAccess call. In that path the
  // polling query never runs, so send one heartbeat immediately for the token.
  useEffect(() => {
    if (
      !slug ||
      !userId ||
      currentData?.status !== "ADMITTED" ||
      !currentData.token ||
      heartbeatTokenRef.current === currentData.token
    ) {
      return;
    }

    heartbeatTokenRef.current = currentData.token;
    sendHeartbeat({ slug, token: currentData.token, lastActivityAt })
      .then((heartbeat) => {
        if (heartbeat.sessionExpiresAt) {
          setHeartbeatSessionExpiresAt(heartbeat.sessionExpiresAt);
        }
      })
      .catch(() => {});
  }, [currentData?.status, currentData?.token, lastActivityAt, slug, userId]);

  // Auto-rejoin: when session expires, clear stale state and re-run requestAccess
  useEffect(() => {
    if (currentData?.status !== "LOST_SESSION") return;
    tokenRef.current = null;
    setWaitRoomToken(null);
    queryClient.resetQueries({ queryKey: ["queue", "access", slug, userId] });
    queryClient.resetQueries({ queryKey: ["queue", "status", slug, userId] });
  }, [currentData?.status, queryClient, slug, userId, setWaitRoomToken]);

  // Fire heartbeat after each status poll while in queue
  useEffect(() => {
    if (!statusQuery.data || !tokenRef.current || !slug || !userId) return;
    const { status } = statusQuery.data;
    if (status !== "QUEUEING" && status !== "ADMITTED") return;

    sendHeartbeat({ slug, token: tokenRef.current, lastActivityAt })
      .then((heartbeat) => {
        if (heartbeat.sessionExpiresAt) {
          setHeartbeatSessionExpiresAt(heartbeat.sessionExpiresAt);
        }
      })
      .catch(() => {});
  }, [lastActivityAt, statusQuery.data, slug, userId]);

  const isLoading = accessQuery.isPending;
  const isError = accessQuery.isError || statusQuery.isError;
  const isReadyToPoll = !!slug && !!userId;

  // Waiting for auth/route context; don't mark as expired before polling starts.
  if (!isReadyToPoll) {
    return {
      status: "waiting",
      token: null,
      position: null,
      queueSize: null,
      sessionExpiresAt: null,
      isLoading: true,
      isError: false,
      isIdle,
      lastActivityAt,
    };
  }

  if (isIdle) {
    return {
      status: "expired",
      token: null,
      position: null,
      queueSize: null,
      sessionExpiresAt: null,
      isLoading: false,
      isError: false,
      isIdle,
      lastActivityAt,
    };
  }

  if (isError || !currentData) {
    return {
      status: "waiting",
      token: null,
      position: null,
      queueSize: null,
      sessionExpiresAt: null,
      isLoading,
      isError,
      isIdle,
      lastActivityAt,
    };
  }

  return {
    status: toFrontendStatus(currentData.status),
    token: currentData.token ?? null,
    position: currentData.position?.position ?? null,
    queueSize: currentData.position?.size ?? null,
    sessionExpiresAt: currentData.sessionExpiresAt ?? heartbeatSessionExpiresAt,
    isLoading: false,
    isError: false,
    isIdle,
    lastActivityAt,
  };
}
