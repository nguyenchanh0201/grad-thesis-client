"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventDetailHeader } from "./event-detail-header";
import { EventDetailSections } from "./event-detail-sections";
import { ActiveCheckoutAlert } from "@/components/booking/active-checkout-alert";
import { clearQueueIntent, setQueueIntent } from "@/lib/booking/queue-intent";
import { clearBuySession } from "@/lib/booking/buy-session";
import { continueActiveCheckout } from "@/lib/booking/active-checkout-actions";
import { useCancelReservation } from "@/hooks/use-booking";
import { useAuthStore } from "@/lib/store/auth.store";
import { useBookingStore } from "@/lib/store/booking";
import { getActiveCheckout } from "@/services/reservation.service";
import type { ActiveCheckoutReservation } from "@/schemas/reservation";
import type { Event } from "@/schemas/event";
import type { EventDetail } from "@/schemas/event";

interface EventDetailViewProps {
  event: Event;
  detail: EventDetail;
}

export function EventDetailView({ event, detail }: EventDetailViewProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const {
    beginBuySession,
    setReservationId,
    reset: storeReset,
  } = useBookingStore();
  const cancelReservationMutation = useCancelReservation();
  const [activeCheckout, setActiveCheckout] =
    useState<ActiveCheckoutReservation | null>(null);
  const [isCheckingActiveCheckout, setIsCheckingActiveCheckout] =
    useState(false);

  const startNewQueue = () => {
    clearBuySession(event.slug);
    storeReset();
    setQueueIntent(event.slug);
    router.push(`/buy/${event.slug}/queue?intent=1`);
  };

  const handleBuy = async () => {
    if (isCheckingActiveCheckout) return;
    if (!isInitialized) return;
    if (!user) {
      const redirect = `/buy/${event.slug}/queue?intent=1`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    try {
      setIsCheckingActiveCheckout(true);
      const result = await getActiveCheckout(event.slug);
      const checkout = result.data.reservation;

      if (!checkout) {
        startNewQueue();
        return;
      }

      setActiveCheckout(checkout);
    } catch {
      return;
    } finally {
      setIsCheckingActiveCheckout(false);
    }
  };

  const handleContinueActiveCheckout = () => {
    if (!activeCheckout) return;
    clearQueueIntent(event.slug);
    const result = continueActiveCheckout(activeCheckout, {
      setReservationId,
      beginBuySession,
    });
    if (result.destination === "provider") {
      window.open(result.href, "_blank", "noopener,noreferrer");
      router.push(
        `/buy/${activeCheckout.eventSlug}/confirmation?reservationId=${encodeURIComponent(
          activeCheckout.id,
        )}`,
      );
      return;
    }
    router.push(result.href);
  };

  const handleCancelAndStartNew = async () => {
    if (!activeCheckout) return;
    try {
      await cancelReservationMutation.mutateAsync(activeCheckout.id);
      clearBuySession(activeCheckout.eventSlug);
      if (activeCheckout.eventSlug !== event.slug) clearBuySession(event.slug);
      clearQueueIntent(activeCheckout.eventSlug);
      setActiveCheckout(null);
      storeReset();
      setQueueIntent(event.slug);
      router.push(`/buy/${event.slug}/queue?intent=1`);
    } catch {
      setActiveCheckout(activeCheckout);
    }
  };

  return (
    <>
      <EventDetailHeader event={detail} onCTAClick={handleBuy} />
      <EventDetailSections event={detail} onBuy={handleBuy} />
      <ActiveCheckoutAlert
        open={!!activeCheckout}
        checkout={activeCheckout}
        isCanceling={cancelReservationMutation.isPending}
        onContinue={handleContinueActiveCheckout}
        onCancelAndStartNew={handleCancelAndStartNew}
      />
    </>
  );
}
