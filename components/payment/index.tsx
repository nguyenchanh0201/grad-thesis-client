"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearBuySession, hasBuySession } from "@/lib/booking/buy-session";
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
import { OrderSummaryPanel } from "@/components/enter-information/order-summary-pannel";
import {
  getAvailablePaymentMethods,
  DEFAULT_EVENT_PAYMENT_CONFIG,
} from "@/lib/payment/getAvailablePaymentMethods";
import { PaymentMethodSelector } from "./payment-method-selector";
import { DiscountCodeInput } from "./discount-code-input";
import { PaymentStickyBar } from "./payment-sticky-bar";
import type { PaymentMethodId } from "@/schemas/payment";

const MOCK_EVENTS = [
  mockEventDetail,
  mockEventDetailTheater,
  mockEventDetailZone,
];
function getMockEvent(slug: string) {
  return MOCK_EVENTS.find((e) => e.slug === slug) ?? mockEventDetail;
}

type Props = { slug: string };

export function Payment({ slug }: Props) {
  const router = useRouter();
  const { formatted, timeRemaining, timedOut, reset } = useTicketTimer();

  const {
    tickets,
    selectedSeats,
    ticketTypes,
    mapType,
    recipient,
    discountCode,
    paymentMethodId,
    setPaymentMethodId,
    reset: storeReset,
  } = useBookingStore();

  const [authorized] = useState(() => hasBuySession(slug));

  useEffect(() => {
    if (!hasBuySession(slug)) {
      storeReset();
      router.replace(`/events/${slug}`);
    }
  }, [slug, router, storeReset]);

  const isWarning = timeRemaining <= 60;
  const event = useMemo(() => getMockEvent(slug), [slug]);

  const availableMethods = useMemo(
    () => getAvailablePaymentMethods(DEFAULT_EVENT_PAYMENT_CONFIG),
    [],
  );

  useEffect(() => {
    if (!paymentMethodId && availableMethods.length > 0) {
      setPaymentMethodId(availableMethods[0].id);
    }
  }, [paymentMethodId, availableMethods, setPaymentMethodId]);

  const subtotal = useMemo(() => {
    if (mapType === "zone") {
      return tickets.reduce((sum, t) => {
        const tt = ticketTypes.find((x) => x.id === t.ticketTypeId);
        return sum + (tt?.price ?? 0) * t.quantity;
      }, 0);
    }
    return selectedSeats.reduce((sum, s) => {
      const tt = ticketTypes.find((x) => x.id === s.ticketTypeId);
      return sum + (tt?.price ?? 0);
    }, 0);
  }, [tickets, selectedSeats, ticketTypes, mapType]);

  const eventSummary = {
    title: event.title,
    image: event.images[0] ?? "",
    dateLabel: event.dates[0]
      ? `${event.dates[0].label} • ${event.dates[0].startTime.slice(11, 16)}`
      : "",
    venueVi: `${event.venue.name}, ${event.venue.city}`,
    venueAddress: event.venue.address,
  };

  const discountProp = discountCode?.valid
    ? { code: discountCode.code, amount: discountCode.discountAmount }
    : null;

  const handleContinue = () => {
    // TODO: initiate VNPay payment flow
    router.replace(`/buy/${slug}/confirmation`);
  };

  const handleBack = () => {
    router.replace(`/buy/${slug}/info`);
  };

  const handleTimeoutOk = () => {
    clearBuySession(slug);
    reset();
    router.replace(`/events/${slug}`);
  };

  if (!authorized) return null;

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col pb-16">
      <ProgressSteps
        currentStep={3}
        formatted={formatted}
        isWarning={isWarning}
        backHref={`/buy/${slug}/info`}
      />
      <EventBanner
        eventTitle={event.title}
        eventDate={eventSummary.dateLabel}
        eventLocation={`${event.venue.name}, ${event.venue.city}`}
      />

      <div className="flex flex-1 flex-col-reverse md:flex-row">
        <div
          className="border-t border-border md:w-[40%] md:overflow-y-auto md:border-t-0 md:border-r"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <OrderSummaryPanel
            event={eventSummary}
            ticketTypes={ticketTypes}
            tickets={tickets}
            selectedSeats={selectedSeats}
            mapType={mapType}
            recipient={recipient}
            discount={discountProp}
          />
        </div>

        <div
          className="flex flex-1 flex-col md:w-[60%] md:overflow-y-auto"
          style={{ maxHeight: "calc(100vh - var(--header-height) - 6rem)" }}
        >
          <div className="flex flex-col gap-6 p-5 pb-8">
            <PaymentMethodSelector
              methods={availableMethods}
              selectedId={paymentMethodId as PaymentMethodId}
              onSelect={setPaymentMethodId}
            />
            <div className="border-t border-border pt-4">
              <DiscountCodeInput subtotal={subtotal} />
            </div>
          </div>
        </div>
      </div>

      <PaymentStickyBar
        canContinue={!!paymentMethodId}
        onBack={handleBack}
        onContinue={handleContinue}
      />

      <TimeoutModal open={timedOut} onOk={handleTimeoutOk} />
    </div>
  );
}
