"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CountdownBar } from "@/components/queue/countdown-bar";
import { EventBanner } from "@/components/queue/event-banner";
import { EventTitle } from "@/components/queue/event-title";
import { QueueCard } from "@/components/queue/queue-card";
import { QueueInstructions } from "@/components/queue/queue-instructions";
import { QueueStatusMessage } from "@/components/queue/queue-status-message";
import { RedirectButton } from "@/components/queue/redirect-button";
import { useQueuePolling } from "@/hooks/use-queue-polling";
import type { FrontendQueueStatus } from "@/schemas/queue";

const REDIRECT_COUNTDOWN_SECONDS = 8;

function QueuePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const entryCode = searchParams.get("entryCode");

  const {
    status: polledStatus,
    purchaseUrl,
    eventData,
  } = useQueuePolling(entryCode);

  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // "ready" is terminal — polling stops there and never reverts
  const displayStatus: FrontendQueueStatus =
    polledStatus === "ready" ? "redirecting" : polledStatus;

  // Tick countdown once admitted
  useEffect(() => {
    if (polledStatus !== "ready") return;
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [polledStatus]);

  // Auto-navigate when countdown reaches 0
  useEffect(() => {
    if (polledStatus !== "ready" || countdown !== 0 || !purchaseUrl) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.push(purchaseUrl);
  }, [polledStatus, countdown, purchaseUrl, router]);

  const handleRedirect = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (purchaseUrl) router.push(purchaseUrl);
  };

  const handleRejoin = () => {
    router.push(
      eventData?.eventSlug ? `/events/${eventData.eventSlug}` : "/events",
    );
  };

  const title = eventData?.title ?? "Loading event...";

  return (
    <QueueCard backgroundImageUrl={eventData?.bannerImageUrl}>
      <EventBanner imageUrl={eventData?.bannerImageUrl} eventTitle={title} />
      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        <QueueStatusMessage status={displayStatus} />
        <EventTitle title={title} />
        <QueueInstructions status={displayStatus} />
        <CountdownBar status={displayStatus} countdown={countdown} />
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
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <QueuePageContent />
    </Suspense>
  );
}
