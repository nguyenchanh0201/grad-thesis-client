"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
import { isValidEmail } from "@/lib/form/email";
import { useBookingStore } from "@/lib/store/booking";
import {
  mockEventDetail,
  mockEventDetailTheater,
  mockEventDetailZone,
} from "@/lib/mock/events";
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

const MOCK_EVENTS = [
  mockEventDetail,
  mockEventDetailTheater,
  mockEventDetailZone,
];
function getMockEvent(slug: string) {
  return MOCK_EVENTS.find((e) => e.slug === slug) ?? mockEventDetail;
}

type Props = { slug: string };

export function EnterInformation({ slug }: Props) {
  const router = useRouter();
  const { formatted, timeRemaining, timedOut, reset } = useTicketTimer();

  const {
    tickets,
    selectedSeats,
    zones,
    mapType,
    recipient,
    reset: storeReset,
  } = useBookingStore();

  const [authorized] = useState(() => hasBuySession(slug));

  useEffect(() => {
    if (!authorized) {
      storeReset(); // clear persisted state so re-queuing always starts fresh
      router.replace(`/events/${slug}`);
    }
  }, [authorized, slug, router, storeReset]);

  const isWarning = timeRemaining <= 60;
  const event = useMemo(() => getMockEvent(slug), [slug]);

  const formRef = useRef<RecipientFormHandle>(null);

  // Derives validity from the store so the bar updates on every keystroke
  const isFormValid =
    !!recipient.fullName?.trim() &&
    !!recipient.email?.trim() &&
    isValidEmail(recipient.email) &&
    !!recipient.phoneNumber?.trim();

  const handleContinue = async () => {
    // Trigger RHF validation to surface inline error messages
    const valid = await formRef.current?.triggerValidation();
    if (!valid) return;
    router.replace(`/buy/${slug}/payment`);
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
    title: event.title,
    image: event.images[0] ?? "",
    dateLabel: event.dates[0]
      ? `${event.dates[0].label} • ${event.dates[0].startTime.slice(11, 16)}`
      : "",
    venueVi: `${event.venue.name}, ${event.venue.city}`,
    venueAddress: event.venue.address,
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
        eventTitle={event.title}
        eventDate={eventSummary.dateLabel}
        eventLocation={`${event.venue.name}, ${event.venue.city}`}
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
        isValid={isFormValid}
        onBack={handleBack}
        onContinue={handleContinue}
      />

      <TimeoutModal open={timedOut} onOk={handleTimeoutOk} />
    </div>
  );
}
