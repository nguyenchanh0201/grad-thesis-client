"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { CountdownBar } from "@/components/queue/countdown-bar";
import { EventBanner } from "@/components/queue/event-banner";
import { EventTitle } from "@/components/queue/event-title";
import { QueueCard } from "@/components/queue/queue-card";
import { QueueInstructions } from "@/components/queue/queue-instructions";
import { QueueStatusMessage } from "@/components/queue/queue-status-message";
import { RedirectButton } from "@/components/queue/redirect-button";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ActiveCheckoutAlert } from "@/components/booking/active-checkout-alert";
import { useQueuePolling } from "@/hooks/use-queue-polling";
import { useActiveCheckout, useCancelReservation } from "@/hooks/use-booking";
import { useAuthStore } from "@/lib/store/auth.store";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import {
  clearBuySession,
  hasBuySession,
  setBuySession,
} from "@/lib/booking/buy-session";
import { resolveQueueGateState } from "@/lib/booking/active-checkout-gate";
import { sendHeartbeat } from "@/services/queue.service";
import {
  clearQueueIntent,
  hasQueueIntent,
  setQueueIntent,
} from "@/lib/booking/queue-intent";
import { continueActiveCheckout } from "@/lib/booking/active-checkout-actions";
import type { FrontendQueueStatus } from "@/schemas/queue";

const REDIRECT_COUNTDOWN_SECONDS = 8;

function QueuePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = useParams<{ slug: string }>();
  const hasEntryIntent = searchParams.get("intent") === "1";
  const isBuySessionActive = hasBuySession(slug);
  const isQueueIntentValid =
    hasEntryIntent || hasQueueIntent(slug) || !isBuySessionActive;

  const user = useAuthStore((s) => s.user);
  const isAuthInitialized = useAuthStore((s) => s.isInitialized);
  const userId = isAuthInitialized ? (user?.id ?? null) : null;
  const {
    beginBuySession,
    setReservationId,
    reset: resetBooking,
  } = useBookingStore();

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;
  const [dismissedActiveCheckoutId, setDismissedActiveCheckoutId] = useState<
    string | null
  >(null);
  const [allowedAfterCancelSlug, setAllowedAfterCancelSlug] = useState<
    string | null
  >(null);
  const activeCheckoutQuery = useActiveCheckout(
    isQueueIntentValid && userId ? slug : undefined,
  );
  const cancelReservationMutation = useCancelReservation();
  const activeCheckout = activeCheckoutQuery.data?.data.reservation ?? null;
  const queueGateState = resolveQueueGateState({
    targetSlug: slug,
    isQueueIntentValid,
    hasUser: !!userId,
    isCheckingActiveCheckout: activeCheckoutQuery.isPending,
    isActiveCheckoutError: activeCheckoutQuery.isError,
    isCanceling: cancelReservationMutation.isPending,
    allowedAfterCancelSlug,
    activeCheckout,
  });
  const isActiveCheckoutDialogOpen =
    queueGateState === "blocked" &&
    !!activeCheckout &&
    dismissedActiveCheckoutId !== activeCheckout.id;

  const {
    status: polledStatus,
    token,
    position,
    queueSize,
    sessionExpiresAt,
  } = useQueuePolling(
    isQueueIntentValid && queueGateState === "allowed" ? slug : null,
    userId,
  );

  const hasRedirectedRef = useRef(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    null,
  );

  const displayStatus: FrontendQueueStatus =
    polledStatus === "ready" ? "redirecting" : polledStatus;

  useEffect(() => {
    if (!slug || !hasEntryIntent) return;
    setQueueIntent(slug);
    window.history.replaceState(null, "", `/buy/${slug}/queue`);
  }, [hasEntryIntent, slug]);

  useEffect(() => {
    if (!slug || hasEntryIntent || isQueueIntentValid) return;

    router.replace(`/buy/${slug}/tickets`);
  }, [hasEntryIntent, isQueueIntentValid, router, slug]);

  const resolveSessionExpiry = useCallback(async (): Promise<string | null> => {
    if (sessionExpiresAt) return sessionExpiresAt;
    if (!slug || !token) return null;
    try {
      const heartbeat = await sendHeartbeat({ slug, token });
      return heartbeat.sessionExpiresAt ?? null;
    } catch {
      return null;
    }
  }, [sessionExpiresAt, slug, token]);

  useEffect(() => {
    if (polledStatus !== "ready" || hasRedirectedRef.current) return;

    let remaining = REDIRECT_COUNTDOWN_SECONDS;

    const timer = setInterval(async () => {
      if (hasRedirectedRef.current) return;
      remaining -= 1;
      if (remaining <= 0) {
        hasRedirectedRef.current = true;
        clearQueueIntent(slug);
        const resolvedExpiry = await resolveSessionExpiry();
        const hasSession = setBuySession(slug, resolvedExpiry ?? undefined);
        if (hasSession) {
          beginBuySession(slug, token);
        }
        router.replace(hasSession ? `/buy/${slug}/tickets` : `/events/${slug}`);
        return;
      }
      setRedirectCountdown(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [
    beginBuySession,
    polledStatus,
    resolveSessionExpiry,
    router,
    slug,
    token,
  ]);

  const handleRedirect = async () => {
    hasRedirectedRef.current = true;
    clearQueueIntent(slug);
    const resolvedExpiry = await resolveSessionExpiry();
    const hasSession = setBuySession(slug, resolvedExpiry ?? undefined);
    if (hasSession) {
      beginBuySession(slug, token);
    }
    router.replace(hasSession ? `/buy/${slug}/tickets` : `/events/${slug}`);
  };

  const handleRejoin = () => {
    clearBuySession(slug);
    clearQueueIntent(slug);
    router.replace(slug ? `/events/${slug}` : "/events");
  };

  const handleContinueActiveCheckout = () => {
    if (!activeCheckout) return;
    clearQueueIntent(slug);
    const result = continueActiveCheckout(activeCheckout, {
      setReservationId,
      beginBuySession,
      restoreBuySession: setBuySession,
    });
    if (result.destination === "provider") {
      window.open(result.href, "_blank", "noopener,noreferrer");
      router.replace(
        `/buy/${activeCheckout.eventSlug}/confirmation?reservationId=${encodeURIComponent(
          activeCheckout.id,
        )}`,
      );
      return;
    }
    router.replace(result.href);
  };

  const handleCancelAndStartNew = async () => {
    if (!activeCheckout) return;
    try {
      await cancelReservationMutation.mutateAsync(activeCheckout.id);
      clearBuySession(activeCheckout.eventSlug);
      if (activeCheckout.eventSlug !== slug) clearBuySession(slug);
      clearQueueIntent(activeCheckout.eventSlug);
      resetBooking();
      setDismissedActiveCheckoutId(activeCheckout.id);
      setAllowedAfterCancelSlug(slug);
    } catch {
      setDismissedActiveCheckoutId(null);
    }
  };

  const eventTitle = event?.eventName ?? "Loading event...";
  const eventImageUrl = event?.featuredImageUrl ?? event?.eventImageUrls?.[0];

  if (!isQueueIntentValid) return null;

  return (
    <QueueCard backgroundImageUrl={eventImageUrl}>
      <EventBanner imageUrl={eventImageUrl} eventTitle={eventTitle} />
      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        <QueueStatusMessage status={displayStatus} />
        <EventTitle title={eventTitle} />
        <QueueInstructions status={displayStatus} />
        <CountdownBar
          status={displayStatus}
          countdown={redirectCountdown ?? REDIRECT_COUNTDOWN_SECONDS}
          position={position}
          queueSize={queueSize}
        />
        <RedirectButton
          status={displayStatus}
          onRedirect={handleRedirect}
          onRejoin={handleRejoin}
        />
        {queueGateState === "error" && (
          <p className="mt-4 text-sm text-destructive">
            We could not check your active checkout. Please refresh before
            joining this queue.
          </p>
        )}
      </div>
      <ActiveCheckoutAlert
        open={isActiveCheckoutDialogOpen}
        checkout={activeCheckout}
        isCanceling={queueGateState === "canceling"}
        onContinue={handleContinueActiveCheckout}
        onCancelAndStartNew={handleCancelAndStartNew}
      />
    </QueueCard>
  );
}

export default function QueuePage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <QueuePageContent />
      </Suspense>
    </AuthGuard>
  );
}
