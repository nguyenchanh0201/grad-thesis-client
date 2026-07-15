"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ticket, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { clearBuySession } from "@/lib/booking/buy-session";
import { isValidEmail } from "@/lib/form/email";
import { isAppError } from "@/core/error";
import { fmt } from "@/lib/strings/money";
import { useBookingStore } from "@/lib/store/booking";
import { useEventBySlug } from "@/hooks/use-events";
import { reservationKeys, useReservation } from "@/hooks/use-booking";
import { getIdentityMe } from "@/services/identity.service";
import {
  cancelReservation,
  updateReservationRecipient,
} from "@/services/reservation.service";
import {
  RESERVATION_STATUS,
  type ReservationResult,
} from "@/schemas/reservation";
import { fmtIsoDate, fmtIsoTime } from "@/lib/date/utils";
import { EventBanner } from "@/components/ticket-selection/event-banner";
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";
import { OrderSummaryPanel } from "./order-summary-pannel";
import {
  RecipientInfoForm,
  type RecipientFormHandle,
} from "./recipient-info-form";
import { StickyValidationBar } from "./sticky-validation-bar";

type Props = { slug: string };
const AUTO_DELIVERY_METHOD = "email_and_physical";

function buildEstimatedTotalFromStore(
  ticketTypes: { id: string; price?: number }[],
  tickets: { ticketTypeId: string; quantity: number }[],
  selectedSeats: { ticketTypeId: string }[],
) {
  const byTicketTypeId = new Map(
    ticketTypes.map((tt) => [tt.id, tt.price ?? 0]),
  );

  const gaTotal = tickets.reduce((sum, row) => {
    const price = byTicketTypeId.get(row.ticketTypeId) ?? 0;
    return sum + price * row.quantity;
  }, 0);

  const seatedTotal = selectedSeats.reduce((sum, seat) => {
    const price = byTicketTypeId.get(seat.ticketTypeId) ?? 0;
    return sum + price;
  }, 0);

  return gaTotal > 0 ? gaTotal : seatedTotal;
}

export function EnterInformation({ slug }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { exitPurchaseFlow } = useBuyProcess();

  const {
    reservationId,
    tickets,
    selectedSeats,
    ticketTypes,
    mapType,
    recipient,
    hydrateFromReservation,
    updateRecipient,
    setReservationId,
  } = useBookingStore();

  const isReturningToTicketsRef = useRef(false);

  useEffect(() => {
    if (reservationId === null && !isReturningToTicketsRef.current) {
      exitPurchaseFlow();
    }
  }, [exitPurchaseFlow, reservationId]);

  const { data: eventResult } = useEventBySlug(slug);
  const event = eventResult?.data;

  const { data: reservationResult } = useReservation(
    reservationId ?? undefined,
  );
  const reservationStatus = reservationResult?.data?.status;

  useEffect(() => {
    if (reservationStatus !== RESERVATION_STATUS.PAYMENT_LOCKED) return;
    if (!reservationId) return;
    router.replace(`/buy/${slug}/payment`);
  }, [reservationId, reservationStatus, router, slug]);

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

  const reservationItems = reservationResult?.data?.items;
  const reservationTicketCount = reservationItems?.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const selectedTicketCountFromStore =
    selectedSeats.length > 0
      ? selectedSeats.length
      : tickets.reduce((sum, item) => sum + item.quantity, 0);

  const ticketCount = reservationTicketCount ?? selectedTicketCountFromStore;

  const estimatedTotalFromStore = buildEstimatedTotalFromStore(
    ticketTypes,
    tickets,
    selectedSeats,
  );
  const totalAmount =
    reservationResult?.data?.totalAmount ?? estimatedTotalFromStore;
  const currency = reservationResult?.data?.currency ?? "VND";

  const handleContinue = async () => {
    if (reservationStatus === RESERVATION_STATUS.PAYMENT_LOCKED) {
      if (reservationId) {
        router.replace(`/buy/${slug}/payment`);
      }
      return;
    }

    const formRecipient = await formRef.current?.validateAndGetValues();
    if (!formRecipient || !reservationId) return;
    setIsSubmitting(true);
    try {
      const updatedReservationResult = await updateReservationRecipient(
        reservationId,
        {
          recipient: {
            fullName: formRecipient.fullName,
            email: formRecipient.email,
            phoneCountryCode: formRecipient.phoneCountryCode,
            phoneNumber: formRecipient.phoneNumber,
            idPassport: formRecipient.idPassport || null,
          },
          deliveryMethod: AUTO_DELIVERY_METHOD,
        },
      );

      const cachedReservationResult =
        queryClient.getQueryData<ReservationResult>(
          reservationKeys.detail(reservationId),
        ) ?? reservationResult;
      const mergedReservation = {
        ...cachedReservationResult?.data,
        ...updatedReservationResult.data,
      };
      const mergedReservationResult: ReservationResult = {
        ...(cachedReservationResult ?? updatedReservationResult),
        ...updatedReservationResult,
        data: mergedReservation,
      };

      queryClient.setQueryData(
        reservationKeys.detail(reservationId),
        mergedReservationResult,
      );
      hydrateFromReservation(mergedReservation);
      router.replace(`/buy/${slug}/payment`);
    } catch (err) {
      if (isAppError(err) && err.status === 409) {
        clearBuySession(slug);
        router.replace(`/events/${slug}`);
        return;
      }
      if (isAppError(err)) {
        toast.error(err.message);
        return;
      }
      toast.error("Could not continue to the next step. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = async () => {
    if (!reservationId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await cancelReservation(reservationId);
      isReturningToTicketsRef.current = true;
      setReservationId(null);
      await queryClient.invalidateQueries({
        queryKey: ["reservations"],
      });
      router.replace(`/buy/${slug}/tickets`);
    } catch (err) {
      if (isAppError(err) && err.status === 409) {
        clearBuySession(slug);
        router.replace(`/events/${slug}`);
        return;
      }
      toast.error(
        isAppError(err)
          ? err.message
          : "Could not release your current selection. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="border-b border-border md:hidden">
        <div className="space-y-3 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Before You Continue
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete required recipient details and confirm your order
              summary.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-sm border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Ticket className="size-3.5" />
                <span>Tickets</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {ticketCount}
              </p>
            </div>
            <div className="rounded-sm border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <WalletCards className="size-3.5" />
                <span>Total</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {fmt(totalAmount)} {currency}
              </p>
            </div>
          </div>
        </div>
      </div>

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
          <div className="flex flex-col gap-8 p-5 pb-8">
            <RecipientInfoForm ref={formRef} />
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
