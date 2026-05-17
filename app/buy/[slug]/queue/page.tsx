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
import { useQueuePolling } from "@/hooks/use-queue-polling";
import { useAuthStore } from "@/lib/store/auth.store";
import { useEventBySlug } from "@/hooks/use-events";
import { hasBuySession, setBuySession } from "@/lib/booking/buy-session";
import { sendHeartbeat } from "@/services/queue.service";
import {
  clearQueueIntent,
  hasQueueIntent,
  setQueueIntent,
} from "@/lib/booking/queue-intent";
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

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;

  const {
    status: polledStatus,
    token,
    position,
    queueSize,
    sessionExpiresAt,
  } = useQueuePolling(isQueueIntentValid ? slug : null, userId);

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
        router.replace(hasSession ? `/buy/${slug}/tickets` : `/events/${slug}`);
        return;
      }
      setRedirectCountdown(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [polledStatus, resolveSessionExpiry, router, slug]);

  const handleRedirect = async () => {
    hasRedirectedRef.current = true;
    clearQueueIntent(slug);
    const resolvedExpiry = await resolveSessionExpiry();
    const hasSession = setBuySession(slug, resolvedExpiry ?? undefined);
    router.replace(hasSession ? `/buy/${slug}/tickets` : `/events/${slug}`);
  };

  const handleRejoin = () => {
    router.replace(slug ? `/events/${slug}` : "/events");
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
      </div>
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
