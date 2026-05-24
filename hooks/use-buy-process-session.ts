"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
import { clearQueueIntent } from "@/lib/booking/queue-intent";
import { isAppError } from "@/core/error";
import { TIMEOUT_REDIRECT_DELAY_MS } from "@/lib/booking/config";
import { useBookingStore } from "@/lib/store/booking";
import {
  isReservationUnavailableError,
  useReservation,
} from "@/hooks/use-booking";
import { useBuySessionSync } from "@/hooks/use-buy-session-sync";
import { useTicketTimer } from "@/hooks/use-ticket-timer";
import { sendHeartbeat } from "@/services/queue.service";

const BUY_HEARTBEAT_INTERVAL_MS = 10_000;

type UseBuyProcessSessionOptions = {
  autoRedirectOnTimeout?: boolean;
  timeoutRedirectDelayMs?: number;
  skipReservationSync?: boolean;
};

export function useBuyProcessSession(
  slug: string,
  {
    autoRedirectOnTimeout = true,
    timeoutRedirectDelayMs = TIMEOUT_REDIRECT_DELAY_MS,
    skipReservationSync = false,
  }: UseBuyProcessSessionOptions = {},
) {
  const router = useRouter();
  const timer = useTicketTimer(slug);
  const { reset, timedOut, syncToExpiry } = timer;
  const storeReset = useBookingStore((state) => state.reset);
  const reservationId = useBookingStore((state) => state.reservationId);
  const waitRoomToken = useBookingStore((state) => state.waitRoomToken);
  const waitRoomSlug = useBookingStore((state) => state.waitRoomSlug);
  const isExitingRef = useRef(false);
  const { data: reservationResult, error: reservationError } = useReservation(
    skipReservationSync ? undefined : (reservationId ?? undefined),
  );

  const exitPurchaseFlow = useCallback(() => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;
    reset();
    storeReset();
    clearQueueIntent(slug);
    router.replace(`/events/${slug}`);
  }, [reset, router, slug, storeReset]);

  useBuySessionSync(slug, exitPurchaseFlow);

  useEffect(() => {
    if (!hasBuySession(slug)) {
      exitPurchaseFlow();
    }
  }, [exitPurchaseFlow, slug]);

  useEffect(() => {
    if (!autoRedirectOnTimeout || !timedOut) return;
    const timeoutId = window.setTimeout(() => {
      clearBuySession(slug);
      exitPurchaseFlow();
    }, timeoutRedirectDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [
    autoRedirectOnTimeout,
    exitPurchaseFlow,
    slug,
    timedOut,
    timeoutRedirectDelayMs,
  ]);

  useEffect(() => {
    if (skipReservationSync) return;
    if (!reservationError) return;
    if (isReservationUnavailableError(reservationError)) {
      syncToExpiry(new Date(0).toISOString());
    }
  }, [reservationError, skipReservationSync, syncToExpiry]);

  useEffect(() => {
    if (skipReservationSync) return;
    const expiresAt = reservationResult?.data?.expiresAt;
    if (!expiresAt) return;
    syncToExpiry(expiresAt);
  }, [reservationResult?.data?.expiresAt, skipReservationSync, syncToExpiry]);

  useEffect(() => {
    if (!hasBuySession(slug) || !waitRoomToken) return;
    if (waitRoomSlug && waitRoomSlug !== slug) return;

    let stopped = false;
    let syncing = false;

    const syncHeartbeat = async () => {
      if (stopped || syncing) return;
      syncing = true;
      try {
        const heartbeat = await sendHeartbeat({ slug, token: waitRoomToken });
        if (heartbeat.sessionExpiresAt && !reservationId) {
          syncToExpiry(heartbeat.sessionExpiresAt);
        }
      } catch (error) {
        if (
          isAppError(error) &&
          [400, 401, 403].includes(error.status) &&
          !stopped
        ) {
          clearBuySession(slug);
          exitPurchaseFlow();
        }
      } finally {
        syncing = false;
      }
    };

    void syncHeartbeat();
    const intervalId = window.setInterval(
      () => void syncHeartbeat(),
      BUY_HEARTBEAT_INTERVAL_MS,
    );

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [
    exitPurchaseFlow,
    reservationId,
    slug,
    syncToExpiry,
    waitRoomSlug,
    waitRoomToken,
  ]);

  return {
    ...timer,
    exitPurchaseFlow,
  };
}
