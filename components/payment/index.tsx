"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import { fmtIsoDate, fmtIsoTime } from "@/lib/date/utils";
import { EventBanner } from "@/components/ticket-selection/event-banner";
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";
import { OrderSummaryPanel } from "@/components/enter-information/order-summary-pannel";
import {
  getAvailablePaymentMethods,
  DEFAULT_EVENT_PAYMENT_CONFIG,
} from "@/lib/payment/getAvailablePaymentMethods";
import { PaymentMethodSelector } from "./payment-method-selector";
import { DiscountCodeInput } from "./discount-code-input";
import { PaymentStickyBar } from "./payment-sticky-bar";
import type { PaymentMethodId } from "@/schemas/payment";

type Props = { slug: string };

export function Payment({ slug }: Props) {
  const router = useRouter();
  const { exitPurchaseFlow } = useBuyProcess();

  const {
    reservationId,
    tickets,
    selectedSeats,
    ticketTypes,
    mapType,
    recipient,
    discountCode,
    paymentMethodId,
    setPaymentMethodId,
  } = useBookingStore();

  useEffect(() => {
    if (reservationId === null) {
      exitPurchaseFlow();
    }
  }, [exitPurchaseFlow, reservationId]);

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;

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
    title: event?.eventName ?? "",
    image: event?.featuredImageUrl ?? event?.eventImageUrls?.[0] ?? "",
    dateLabel: event?.eventDate
      ? `${fmtIsoDate(event.eventDate)} - ${fmtIsoTime(event.eventDate)}`
      : "",
    venueVi: event?.venue
      ? `${event.venue.venueName ?? ""}, ${event.venue.city ?? ""}`
      : "",
    venueAddress: event?.venue?.address ?? "",
  };

  const discountProp = discountCode?.valid
    ? { code: discountCode.code, amount: discountCode.discountAmount }
    : null;

  const handleContinue = () => {
    router.replace(`/buy/${slug}/confirmation`);
  };

  const handleBack = () => {
    router.replace(`/buy/${slug}/info`);
  };

  return (
    <div className="flex flex-1 flex-col pb-16">
      <EventBanner
        eventTitle={eventSummary.title}
        eventDate={eventSummary.dateLabel}
        eventLocation={eventSummary.venueVi}
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
    </div>
  );
}
