"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
import { isValidEmail } from "@/lib/form/email";
import { isAppError } from "@/core/error";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import { useReservation } from "@/hooks/use-booking";
import { updateReservationRecipient } from "@/services/reservation.service";
import { fmtIsoDate, fmtIsoTime } from "@/lib/date/utils";
import { EventBanner } from "@/components/ticket-selection/event-banner";
import { ProgressSteps } from "@/components/ticket-selection/progress-steps";
import { TimeoutModal } from "@/components/ticket-selection/timeout-modal";
import { useTicketTimer } from "@/hooks/use-ticket-timer";
import { OrderSummaryPanel } from "./order-summary-pannel";
import {
  RecipientInfoForm,
  type RecipientFormHandle,
} from "./recipient-info-form";
import { TicketDeliveryMethod } from "./ticket-delivery-method";
import { StickyValidationBar } from "./sticky-validation-bar";

type Props = { slug: string };

export function EnterInformation({ slug }: Props) {
  const router = useRouter();
  const { formatted, timeRemaining, timedOut, reset, syncToExpiry } =
    useTicketTimer();

  const {
    reservationId,
    tickets,
    selectedSeats,
    zones,
    mapType,
    recipient,
    deliveryMethod,
    reset: storeReset,
  } = useBookingStore();

  const [authorized] = useState(() => hasBuySession(slug));

  useEffect(() => {
    if (!authorized) {
      storeReset();
      router.replace(`/events/${slug}`);
    }
  }, [authorized, slug, router, storeReset]);

  // Redirect when reservationId is missing (shouldn't reach this page without one)
  useEffect(() => {
    if (authorized && reservationId === null) {
      router.replace(`/events/${slug}`);
    }
  }, [authorized, reservationId, slug, router]);

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;

  const { data: reservationResult, error: reservationError } = useReservation(
    reservationId ?? undefined,
  );

  // Handle reservation errors: 404, 403 → redirect; 409 NOT_PENDING → clear + redirect
  useEffect(() => {
    if (!reservationError) return;
    if (isAppError(reservationError)) {
      if (reservationError.code === "RESERVATION_NOT_PENDING") {
        clearBuySession(slug);
      }
      router.replace(`/events/${slug}`);
    }
  }, [reservationError, slug, router]);

  // Sync countdown to server expiry once the reservation loads
  useEffect(() => {
    const expiresAt = reservationResult?.data?.expiresAt;
    if (expiresAt) syncToExpiry(expiresAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationResult?.data?.expiresAt]);

  const isWarning = timeRemaining <= 60;
  const formRef = useRef<RecipientFormHandle>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid =
    !!recipient.fullName?.trim() &&
    !!recipient.email?.trim() &&
    isValidEmail(recipient.email) &&
    !!recipient.phoneNumber?.trim();

  const handleContinue = async () => {
    const valid = await formRef.current?.triggerValidation();
    if (!valid || !reservationId) return;
    setIsSubmitting(true);
    try {
      await updateReservationRecipient(reservationId, {
        recipient: {
          fullName: recipient.fullName,
          email: recipient.email,
          phoneCountryCode: recipient.phoneCountryCode,
          phoneNumber: recipient.phoneNumber,
          idPassport: recipient.idPassport || null,
        },
        deliveryMethod,
      });
      router.replace(`/buy/${slug}/payment`);
    } catch (err) {
      if (isAppError(err) && err.status === 409) {
        clearBuySession(slug);
        router.replace(`/events/${slug}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.replace(`/buy/${slug}/tickets`);
  };

  const handleTimeoutOk = () => {
    clearBuySession(slug);
    reset();
    router.replace(`/events/${slug}`);
  };

  if (!authorized) return null;

  const eventSummary = {
    title: event?.eventName ?? "",
    image: event?.featuredImageUrl ?? event?.eventImageUrls?.[0] ?? "",
    dateLabel: event?.eventDate
      ? `${fmtIsoDate(event.eventDate)} • ${fmtIsoTime(event.eventDate)}`
      : "",
    venueVi: event?.venue
      ? `${event.venue.venueName ?? ""}, ${event.venue.city ?? ""}`
      : "",
    venueAddress: event?.venue?.address ?? "",
  };

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col pb-16">
      <ProgressSteps
        currentStep={2}
        formatted={formatted}
        isWarning={isWarning}
        backHref={`/buy/${slug}/tickets`}
      />
      <EventBanner
        eventTitle={eventSummary.title}
        eventDate={eventSummary.dateLabel}
        eventLocation={eventSummary.venueVi}
      />

      {/* Two-panel layout — mobile: form on top, summary below */}
      <div className="flex flex-1 flex-col-reverse md:flex-row">
        {/* Left: order summary (40%) */}
        <div
          className="border-t border-border md:w-[40%] md:overflow-y-auto md:border-t-0 md:border-r"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <OrderSummaryPanel
            event={eventSummary}
            zones={zones}
            tickets={tickets}
            selectedSeats={selectedSeats}
            mapType={mapType}
            recipient={recipient}
          />
        </div>

        {/* Right: form (60%) */}
        <div
          className="flex flex-1 flex-col md:w-[60%] md:overflow-y-auto"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <div className="flex flex-col gap-6 p-5 pb-8">
            <RecipientInfoForm ref={formRef} />
            <div className="border-t border-border pt-4">
              <TicketDeliveryMethod />
            </div>
          </div>
        </div>
      </div>

      <StickyValidationBar
        isValid={isFormValid && !isSubmitting}
        onBack={handleBack}
        onContinue={handleContinue}
      />

      <TimeoutModal open={timedOut} onOk={handleTimeoutOk} />
    </div>
  );
}
