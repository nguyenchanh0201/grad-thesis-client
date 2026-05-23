"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useBookingStore } from "@/lib/store/booking";
import { useReservation } from "@/hooks/use-booking";
import { useEventBySlug } from "@/hooks/use-events";
import { fmtIsoDate, fmtIsoTime } from "@/lib/date/utils";
import { EventBanner } from "@/components/ticket-selection/event-banner";
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";
import { OrderSummaryPanel } from "@/components/enter-information/order-summary-pannel";
import {
  createVNPayUrl,
  getPaymentConfirmationStatus,
  getPaymentMethodsByEventSlug,
} from "@/services/payment.service";
import { getAvailableVouchers } from "@/services/reservation.service";
import { PaymentMethodSelector } from "./payment-method-selector";
import { DiscountCodeInput } from "./discount-code-input";
import { PaymentStickyBar } from "./payment-sticky-bar";
import { VOUCHER_DISCOUNT_TYPE, type PaymentMethodId } from "@/schemas/payment";
import { RESERVATION_STATUS } from "@/schemas/reservation/reservation.schema";

type Props = { slug: string };

export function Payment({ slug }: Props) {
  const router = useRouter();
  const { exitPurchaseFlow } = useBuyProcess();

  const {
    reservationId,
    waitRoomToken,
    tickets,
    selectedSeats,
    ticketTypes,
    mapType,
    recipient,
    discountCode,
    paymentMethodId,
    setPaymentMethodId,
    setDiscountCode,
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
  const reservation = reservationResult?.data;
  const {
    data: confirmation,
    isLoading: isConfirmationLoading,
    isError: isConfirmationError,
  } = useQuery({
    queryKey: ["payment-confirmation", reservationId],
    queryFn: () => getPaymentConfirmationStatus(reservationId!),
    enabled: !!reservationId,
    retry: false,
    refetchInterval: 5000,
  });

  const {
    data: availableMethods = [],
    isLoading: isPaymentMethodsLoading,
    isError: isPaymentMethodsError,
  } = useQuery({
    queryKey: ["payment-methods", slug],
    queryFn: () => getPaymentMethodsByEventSlug(slug),
    enabled: !!slug,
  });

  const {
    data: vouchersResult,
    isLoading: isVouchersLoading,
    isError: isVouchersError,
  } = useQuery({
    queryKey: ["vouchers", slug],
    queryFn: () => getAvailableVouchers(slug),
    enabled: !!slug,
  });

  const availableVouchers = vouchersResult?.data ?? [];

  useEffect(() => {
    const hasSelectedMethod = availableMethods.some(
      (method) => method.id === paymentMethodId,
    );
    if (!hasSelectedMethod && availableMethods.length > 0) {
      setPaymentMethodId(availableMethods[0].id);
    }
  }, [paymentMethodId, availableMethods, setPaymentMethodId]);

  const hasSelectedEligibleMethod = availableMethods.some(
    (method) => method.id === paymentMethodId,
  );
  const isVnpaySelected = paymentMethodId === "vnpay";
  const reservationStatus = confirmation?.reservationStatus;
  const isReservationTerminal =
    reservationStatus === RESERVATION_STATUS.PAID ||
    reservationStatus === RESERVATION_STATUS.CANCELLED ||
    reservationStatus === RESERVATION_STATUS.EXPIRED;
  const canPayReservation =
    reservationStatus === RESERVATION_STATUS.PENDING ||
    reservationStatus === RESERVATION_STATUS.PAYMENT_LOCKED;
  const createPaymentMutation = useMutation({
    mutationFn: createVNPayUrl,
    retry: false,
  });

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

  const appliedVoucher = reservation?.voucher ?? null;
  const discountProp = appliedVoucher
    ? { code: appliedVoucher.code, amount: appliedVoucher.discountAmount }
    : null;

  useEffect(() => {
    const voucher = reservation?.voucher;
    if (!voucher) {
      if (discountCode) {
        setDiscountCode(null);
      }
      return;
    }

    if (
      discountCode?.valid &&
      discountCode.code === voucher.code &&
      discountCode.discountAmount === voucher.discountAmount
    ) {
      return;
    }

    setDiscountCode({
      code: voucher.code,
      valid: true,
      type: voucher.type ?? VOUCHER_DISCOUNT_TYPE.FIXED,
      discountAmount: voucher.discountAmount,
    });
  }, [discountCode, reservation?.voucher, setDiscountCode]);

  const handleContinue = () => {
    if (!reservationId || !reservation) return;
    if (!isVnpaySelected) return;
    if (!waitRoomToken) {
      router.replace(`/buy/${slug}/queue`);
      return;
    }
    if (!canPayReservation) {
      router.replace(`/buy/${slug}/confirmation`);
      return;
    }

    createPaymentMutation.mutate(
      {
        reservationId,
        waitRoomToken,
      },
      {
        onSuccess: (result) => {
          if (typeof window === "undefined") return;
          window.location.assign(result.paymentUrl);
        },
      },
    );
  };

  const handleBack = () => {
    router.replace(`/buy/${slug}/info`);
  };

  return (
    <div className="flex flex-1 flex-col pb-28 sm:pb-24">
      <EventBanner
        eventTitle={eventSummary.title}
        eventDate={eventSummary.dateLabel}
        eventLocation={eventSummary.venueVi}
      />

      <main className="flex flex-1 flex-col-reverse md:flex-row">
        <section className="md:w-[40%] md:overflow-y-auto md:shadow-[inset_-1px_0_0_#f3f4f6]">
          <div className="px-5 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Order summary
            </p>
            <h2 className="line-clamp-none mt-1 text-lg font-medium text-foreground">
              Check details before payment
            </h2>
          </div>

          <OrderSummaryPanel
            event={eventSummary}
            ticketTypes={ticketTypes}
            tickets={tickets}
            selectedSeats={selectedSeats}
            mapType={mapType}
            recipient={recipient}
            reservationItems={reservation?.items}
            reservationTotalAmount={reservation?.totalAmount}
            reservationSubtotalAmount={reservation?.subtotalAmount}
            discount={discountProp}
          />
        </section>

        <section className="flex flex-1 flex-col md:w-[60%] md:overflow-y-auto">
          <div className="flex flex-col gap-6 p-5 pb-8 sm:p-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Checkout
              </p>
              <h1 className="line-clamp-none text-xl font-medium text-foreground sm:text-2xl">
                Review and pay
              </h1>
              <p className="line-clamp-none max-w-2xl text-sm leading-6 text-muted-foreground">
                Confirm your order details and continue to VNPay checkout.
              </p>
            </div>

            <PaymentMethodSelector
              methods={availableMethods}
              selectedId={paymentMethodId as PaymentMethodId}
              onSelect={setPaymentMethodId}
            />
            {isPaymentMethodsLoading ? (
              <p className="text-xs text-muted-foreground">
                Loading payment methods...
              </p>
            ) : null}
            {isPaymentMethodsError ? (
              <p className="text-xs text-destructive">
                Could not load payment methods. Please refresh and try again.
              </p>
            ) : null}

            {isConfirmationLoading ? (
              <p className="text-xs text-muted-foreground">
                Loading payment status...
              </p>
            ) : null}
            {isConfirmationError ? (
              <p className="text-xs text-destructive">
                Could not load current payment status.
              </p>
            ) : null}
            {reservationStatus === RESERVATION_STATUS.PAID ? (
              <p className="text-xs text-emerald-600">
                This reservation is already paid.
              </p>
            ) : null}
            {reservationStatus === RESERVATION_STATUS.CANCELLED ? (
              <p className="text-xs text-destructive">
                This reservation has been cancelled.
              </p>
            ) : null}
            {reservationStatus === RESERVATION_STATUS.EXPIRED ? (
              <p className="text-xs text-destructive">
                This reservation has expired.
              </p>
            ) : null}
            {createPaymentMutation.isError ? (
              <p className="text-xs text-destructive">
                Could not start VNPay checkout. Please refresh and try again.
              </p>
            ) : null}

            <DiscountCodeInput
              reservationId={reservationId}
              vouchers={availableVouchers}
              appliedVoucher={appliedVoucher}
            />
            {isVouchersLoading ? (
              <p className="text-xs text-muted-foreground">
                Loading vouchers...
              </p>
            ) : null}
            {isVouchersError ? (
              <p className="text-xs text-destructive">
                Could not load vouchers. You can still enter a voucher code
                manually.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      <PaymentStickyBar
        canContinue={
          !!reservationId &&
          !!reservation &&
          hasSelectedEligibleMethod &&
          isVnpaySelected &&
          canPayReservation &&
          !isReservationTerminal &&
          !isConfirmationLoading
        }
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel="Buy"
        continueBusyLabel="Proceeding..."
        isContinuing={createPaymentMutation.isPending}
      />
    </div>
  );
}
