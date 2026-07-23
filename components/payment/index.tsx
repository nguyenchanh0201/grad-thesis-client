"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBookingStore } from "@/lib/store/booking";
import { useReservation } from "@/hooks/use-booking";
import { useEventBySlug } from "@/hooks/use-events";
import { clearBuySession } from "@/lib/booking/buy-session";
import { isAppError } from "@/core/error";
import { fmtIsoDate, fmtIsoTime } from "@/lib/date/utils";
import { EventBanner } from "@/components/ticket-selection/event-banner";
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";
import { OrderSummaryPanel } from "@/components/enter-information/order-summary-pannel";
import {
  preparePayment,
  getPaymentConfirmationStatus,
  getPaymentMethodsByEventSlug,
} from "@/services/payment.service";
import {
  cancelReservation,
  getAvailableVouchers,
} from "@/services/reservation.service";
import { PaymentMethodSelector } from "./payment-method-selector";
import { DiscountCodeInput } from "./discount-code-input";
import { PaymentStickyBar } from "./payment-sticky-bar";
import { VOUCHER_DISCOUNT_TYPE, type PaymentMethodId } from "@/schemas/payment";
import { RESERVATION_STATUS } from "@/schemas/reservation/reservation.schema";

type Props = { slug: string };

function withMockCheckoutReturnTo(
  paymentUrl: string,
  returnTo: string,
): string {
  if (typeof window === "undefined") return paymentUrl;

  try {
    const url = new URL(paymentUrl, window.location.href);
    if (
      url.origin === window.location.origin &&
      url.pathname === "/mock-checkout"
    ) {
      url.searchParams.set("returnTo", returnTo);
      return url.toString();
    }
  } catch {
    return paymentUrl;
  }

  return paymentUrl;
}

export function Payment({ slug }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    hydrateFromReservation,
    setReservationId,
    setPaymentMethodId,
    setDiscountCode,
  } = useBookingStore();
  const [userSelectedMethodId, setUserSelectedMethodId] =
    useState<PaymentMethodId | null>(null);
  const [isReturningToTickets, setIsReturningToTickets] = useState(false);
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
  const reservation = reservationResult?.data;

  useEffect(() => {
    if (reservation) hydrateFromReservation(reservation);
  }, [hydrateFromReservation, reservation]);
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

  const reservationStatus = confirmation?.reservationStatus;
  const activePaymentUrl =
    confirmation?.payment?.status === "INITIATED"
      ? (confirmation.payment.paymentUrl ?? null)
      : null;
  const activePaymentMethodId = confirmation?.payment?.methodId ?? null;
  const defaultSelectedMethodId = useMemo(() => {
    if (
      paymentMethodId &&
      availableMethods.some((method) => method.id === paymentMethodId)
    ) {
      return paymentMethodId;
    }

    if (
      activePaymentMethodId &&
      availableMethods.some((method) => method.id === activePaymentMethodId)
    ) {
      return activePaymentMethodId;
    }

    return availableMethods[0]?.id ?? null;
  }, [activePaymentMethodId, availableMethods, paymentMethodId]);
  const selectedMethodId = userSelectedMethodId ?? defaultSelectedMethodId;
  const hasSelectedEligibleMethod = availableMethods.some(
    (method) => method.id === selectedMethodId,
  );
  const selectedMethod = availableMethods.find(
    (m) => m.id === selectedMethodId,
  );
  const isHostedGateway =
    selectedMethod?.checkoutConfig?.type === "hosted_gateway";

  useEffect(() => {
    if (!reservationId) return;

    if (
      reservationStatus === RESERVATION_STATUS.CANCELLED ||
      reservationStatus === RESERVATION_STATUS.EXPIRED
    ) {
      void exitPurchaseFlow({ clearSession: true });
      return;
    }

    if (reservationStatus === RESERVATION_STATUS.PAID) {
      router.replace(
        `/buy/${slug}/confirmation?reservationId=${encodeURIComponent(
          reservationId,
        )}`,
      );
    }
  }, [exitPurchaseFlow, reservationId, reservationStatus, router, slug]);

  const isReservationTerminal =
    reservationStatus === RESERVATION_STATUS.PAID ||
    reservationStatus === RESERVATION_STATUS.CANCELLED ||
    reservationStatus === RESERVATION_STATUS.EXPIRED;
  const canPayReservation =
    reservationStatus === RESERVATION_STATUS.PENDING ||
    reservationStatus === RESERVATION_STATUS.PAYMENT_LOCKED;
  const canRefreshExpiredHostedPayment =
    hasSelectedEligibleMethod &&
    isHostedGateway &&
    reservationStatus === RESERVATION_STATUS.PAYMENT_LOCKED &&
    !activePaymentUrl &&
    activePaymentMethodId === selectedMethodId;
  const canContinuePayment =
    !!reservationId &&
    !!reservation &&
    canPayReservation &&
    !isReservationTerminal &&
    !isConfirmationLoading &&
    hasSelectedEligibleMethod;
  const createPaymentMutation = useMutation({
    mutationFn: preparePayment,
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
    if (!canPayReservation) {
      router.replace(`/buy/${slug}/confirmation`);
      return;
    }

    const currentReservationId = reservationId;
    const confirmationHref = `/buy/${slug}/confirmation?reservationId=${encodeURIComponent(
      currentReservationId,
    )}`;

    if (!selectedMethodId) {
      return;
    }

    const methodId = selectedMethodId;
    createPaymentMutation.mutate(
      {
        reservationId: currentReservationId,
        waitRoomToken: waitRoomToken ?? undefined,
        methodId,
        refreshExpiredPaymentUrl: canRefreshExpiredHostedPayment,
      },
      {
        onSuccess: (result) => {
          setPaymentMethodId(result.methodId);
          queryClient.setQueryData(
            ["payment-confirmation", currentReservationId],
            (previous: typeof confirmation) =>
              previous
                ? {
                    ...previous,
                    reservationStatus: RESERVATION_STATUS.PAYMENT_LOCKED,
                    effectiveExpiresAt: result.expiresAt,
                    payment: {
                      id: result.transactionId,
                      externalRefId: result.externalRefId,
                      status: "INITIATED" as const,
                      providerCode: result.providerCode,
                      methodId: result.methodId,
                      paymentUrl: result.paymentUrl ?? null,
                      initiatedAt: new Date().toISOString(),
                      completedAt: null,
                    },
                    activeMethod:
                      availableMethods.find(
                        (method) => method.id === result.methodId,
                      ) ??
                      previous.activeMethod ??
                      null,
                  }
                : previous,
          );
          void queryClient.invalidateQueries({
            queryKey: ["payment-confirmation", currentReservationId],
          });
          if (typeof window === "undefined") return;
          if (result.paymentUrl) {
            window.location.assign(
              withMockCheckoutReturnTo(result.paymentUrl, confirmationHref),
            );
            return;
          }
          router.replace(confirmationHref);
        },
      },
    );
  };

  const handleBack = async () => {
    if (
      !reservationId ||
      createPaymentMutation.isPending ||
      isReturningToTickets
    ) {
      return;
    }

    setIsReturningToTickets(true);
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
      setIsReturningToTickets(false);
    }
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
            reservationRecipient={reservation?.recipient}
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
                Confirm your order details and continue to payment.
              </p>
            </div>

            <PaymentMethodSelector
              methods={availableMethods}
              selectedId={selectedMethodId ?? undefined}
              onSelect={(methodId) => {
                setUserSelectedMethodId(methodId);
              }}
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
                Could not start checkout. Please refresh and try again.
              </p>
            ) : null}
            {canRefreshExpiredHostedPayment ? (
              <p className="text-xs text-muted-foreground">
                The previous payment link is no longer reusable. Generate a new
                payment link to continue this reservation.
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
        canContinue={canContinuePayment}
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel={
          canRefreshExpiredHostedPayment ? "Generate new payment link" : "Buy"
        }
        continueBusyLabel="Proceeding..."
        isContinuing={createPaymentMutation.isPending}
        isBackDisabled={createPaymentMutation.isPending || isReturningToTickets}
      />
    </div>
  );
}
