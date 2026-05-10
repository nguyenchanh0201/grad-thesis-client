"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { CountdownBar } from "@/components/queue/countdown-bar";
import { EventBanner } from "@/components/queue/event-banner";
import { EventTitle } from "@/components/queue/event-title";
import { QueueCard } from "@/components/queue/queue-card";
import { QueueInstructions } from "@/components/queue/queue-instructions";
import { QueueStatusMessage } from "@/components/queue/queue-status-message";
import { RedirectButton } from "@/components/queue/redirect-button";
import { useQueuePolling } from "@/hooks/use-queue-polling";
import { useAuthStore } from "@/lib/store/auth.store";
import { useEventBySlug } from "@/hooks/use-events";
import { setBuySession } from "@/lib/booking/buy-session";
import type { FrontendQueueStatus } from "@/schemas/queue";

const REDIRECT_COUNTDOWN_SECONDS = 8;
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "1";

function QueuePageContent() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? DEFAULT_USER_ID;

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;

  const { status: polledStatus } = useQueuePolling(slug, userId);

  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayStatus: FrontendQueueStatus =
    polledStatus === "ready" ? "redirecting" : polledStatus;

  useEffect(() => {
    if (polledStatus !== "ready") return;
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [polledStatus]);

  useEffect(() => {
    if (polledStatus !== "ready" || countdown !== 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setBuySession(slug);
    router.replace(`/buy/${slug}/tickets`);
  }, [polledStatus, countdown, router, slug]);

  const handleRedirect = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setBuySession(slug);
    router.replace(`/buy/${slug}/tickets`);
  };

  const handleRejoin = () => {
    router.replace(slug ? `/events/${slug}` : "/events");
  };

  const eventTitle = event?.eventName ?? "Loading event...";
  const eventImageUrl = event?.featuredImageUrl ?? event?.eventImageUrls?.[0];

  console.log(event);

  return (
    <QueueCard backgroundImageUrl={eventImageUrl}>
      <EventBanner imageUrl={eventImageUrl} eventTitle={eventTitle} />
      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        <QueueStatusMessage status={displayStatus} />
        <EventTitle title={eventTitle} />
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
