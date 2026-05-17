"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clearBuySession } from "@/lib/booking/buy-session";
import { isValidEmail } from "@/lib/form/email";
import { isAppError } from "@/core/error";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import { useReservation } from "@/hooks/use-booking";
import { getIdentityMe } from "@/services/identity.service";
import { updateReservationRecipient } from "@/services/reservation.service";
import { fmtIsoDate, fmtIsoTime } from "@/lib/date/utils";
import { EventBanner } from "@/components/ticket-selection/event-banner";
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";
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
  const { exitPurchaseFlow } = useBuyProcess();

  const {
    reservationId,
    tickets,
    selectedSeats,
    ticketTypes,
    mapType,
    recipient,
    deliveryMethod,
    hydrateFromReservation,
    updateRecipient,
  } = useBookingStore();

  useEffect(() => {
    if (reservationId === null) {
      exitPurchaseFlow();
    }
  }, [exitPurchaseFlow, reservationId]);

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;

  const { data: reservationResult } = useReservation(
    reservationId ?? undefined,
  );

  const { data: identityResult } = useQuery({
    queryKey: ["current-user"],
    queryFn: getIdentityMe,
    retry: false,
  });

  useEffect(() => {
    if (reservationResult?.data) hydrateFromReservation(reservationResult.data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationResult?.data]);

  useEffect(() => {
    if (reservationResult?.data?.recipient) return;

    const user = identityResult?.data?.user;
    if (!user) return;

    const hasTypedRecipient =
      !!recipient.fullName.trim() ||
      !!recipient.email.trim() ||
      !!recipient.phoneNumber.trim() ||
      !!recipient.idPassport.trim();
    if (hasTypedRecipient) return;

    const phone = user.phone?.trim();
    const phoneMatch = phone?.match(/^(\+\d{1,3})\s*(.*)$/);

    updateRecipient({
      fullName: user.fullName?.trim() || "",
      email: user.email,
      phoneCountryCode: phoneMatch?.[1] ?? recipient.phoneCountryCode,
      phoneNumber: phoneMatch?.[2]?.trim() || phone || "",
    });
  }, [
    identityResult?.data?.user,
    recipient.email,
    recipient.fullName,
    recipient.idPassport,
    recipient.phoneCountryCode,
    recipient.phoneNumber,
    reservationResult?.data?.recipient,
    updateRecipient,
  ]);

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
            reservationItems={reservationResult?.data?.items}
            reservationTotalAmount={reservationResult?.data?.totalAmount}
            reservationCurrency={reservationResult?.data?.currency}
          />
        </div>

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
    </div>
  );
}
