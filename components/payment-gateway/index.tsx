"use client";

import { useEffect, useMemo, useId } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAppError } from "@/core/error";
import { RESERVATION_POLL_INTERVAL_MS } from "@/lib/booking/config";
import { useBookingStore } from "@/lib/store/booking";
import { refreshBuySessionDeadline } from "@/lib/booking/buy-session";
import {
  getPaymentConfirmationStatus,
  getPaymentMethodsByEventSlug,
  preparePayment,
} from "@/services/payment.service";
import { RESERVATION_STATUS } from "@/schemas/reservation/reservation.schema";
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";
import type { GatewayLineItem } from "@/schemas/payment-gateway";
import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import type { MapType } from "@/schemas/seat";
import type { TicketType } from "@/schemas/ticket-type";
import {
  buildPaymentReference,
  buildTransferQrValue,
  getManualTransferDetails,
  getPaymentMethodPresentation,
} from "./payment-method-config";
import { PaymentPanel } from "./payment-pannel";
import { OrderSummarySidebar } from "./order-summary-sidebar";
import { GatewayFooter } from "./gateway-footer";
import { Button } from "@/components/ui/button";
import {
  hasActiveInitiatedPaymentForMethod,
  shouldPreparePayment,
} from "./payment-session";

function buildLineItems(
  tickets: SelectedTicket[],
  selectedSeats: SelectedSeat[],
  ticketTypes: TicketType[],
  mapType: MapType,
): GatewayLineItem[] {
  if (mapType === "zone") {
    return tickets.map((t) => {
      const tt = ticketTypes.find((x) => x.id === t.ticketTypeId);
      const price = tt?.price ?? 0;
      return {
        label: tt?.name ?? t.ticketTypeId,
        quantity: t.quantity,
        unitPrice: price,
        total: price * t.quantity,
      };
    });
  }
  const byType = new Map<string, number>();
  selectedSeats.forEach((s) =>
    byType.set(s.ticketTypeId, (byType.get(s.ticketTypeId) ?? 0) + 1),
  );

  return Array.from(byType.entries()).map(([ticketTypeId, count]) => {
    const tt = ticketTypes.find((x) => x.id === ticketTypeId);
    const price = tt?.price ?? 0;
    return {
      label: tt?.name ?? ticketTypeId,
      quantity: count,
      unitPrice: price,
      total: price * count,
    };
  });
}

const SESSION_TIMESTAMP = new Date()
  .toISOString()
  .replace(/[-T:.Z]/g, "")
  .slice(0, 18);

type Props = { slug: string };

export function PaymentGateway({ slug }: Props) {
  const {
    reservationId,
    waitRoomToken,
    paymentMethodId,
    tickets,
    selectedSeats,
    ticketTypes,
    mapType,
    discountCode,
  } = useBookingStore();
  const { syncToExpiry, replaceWithAuthoritativeExpiry, exitPurchaseFlow } =
    useBuyProcess();
  const {
    data: confirmation,
    error: confirmationError,
    isLoading: isConfirmationLoading,
  } = useQuery({
    queryKey: ["payment-confirmation", reservationId],
    queryFn: () => getPaymentConfirmationStatus(reservationId!),
    enabled: !!reservationId,
    retry: false,
    refetchInterval: RESERVATION_POLL_INTERVAL_MS,
  });

  const uid = useId();
  const invoiceId = `INV-${SESSION_TIMESTAMP}-${uid.replace(/:/g, "")}`;

  const lineItems = useMemo(
    () => buildLineItems(tickets, selectedSeats, ticketTypes, mapType),
    [tickets, selectedSeats, ticketTypes, mapType],
  );

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountCode?.valid ? discountCode.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const reservationExpiresAt =
    confirmation?.effectiveExpiresAt ?? confirmation?.expiresAt;
  const reservationTotalAmount = Number(confirmation?.totalAmount ?? 0);
  const reservationStatus = confirmation?.reservationStatus;
  const deadline = useMemo(
    () => (reservationExpiresAt ? new Date(reservationExpiresAt) : null),
    [reservationExpiresAt],
  );
  const { data: availableMethods = [] } = useQuery({
    queryKey: ["payment-methods", slug],
    queryFn: () => getPaymentMethodsByEventSlug(slug),
    enabled: !!slug,
  });

  const confirmationMethod = confirmation?.activeMethod ?? undefined;
  const effectiveMethodId = confirmation?.payment?.methodId ?? paymentMethodId;
  const selectedMethod = useMemo(() => {
    if (confirmationMethod) return confirmationMethod;
    return availableMethods.find((method) => method.id === effectiveMethodId);
  }, [availableMethods, confirmationMethod, effectiveMethodId]);
  const presentation = useMemo(
    () => getPaymentMethodPresentation(effectiveMethodId, selectedMethod),
    [effectiveMethodId, selectedMethod],
  );
  const paymentReference = useMemo(
    () => buildPaymentReference(reservationId, invoiceId),
    [invoiceId, reservationId],
  );
  const transferDetails = useMemo(
    () =>
      getManualTransferDetails(
        effectiveMethodId,
        selectedMethod,
        reservationId,
        presentation.label,
        paymentReference,
        reservationTotalAmount || total,
      ),
    [
      effectiveMethodId,
      paymentReference,
      presentation.label,
      reservationId,
      reservationTotalAmount,
      selectedMethod,
      total,
    ],
  );
  const transferQrValue = useMemo(
    () =>
      buildTransferQrValue(
        selectedMethod,
        reservationId,
        paymentReference,
        reservationTotalAmount || total,
        transferDetails,
      ),
    [
      paymentReference,
      reservationId,
      reservationTotalAmount,
      selectedMethod,
      total,
      transferDetails,
    ],
  );
  const isPaymentSuccess = reservationStatus === RESERVATION_STATUS.PAID;
  const isPaymentFailed =
    reservationStatus === RESERVATION_STATUS.CANCELLED ||
    reservationStatus === RESERVATION_STATUS.EXPIRED;
  const preparePaymentMutation = useMutation({
    mutationFn: preparePayment,
    retry: false,
  });
  const preparedPayment = preparePaymentMutation.data;
  const hasActivePayment = hasActiveInitiatedPaymentForMethod(
    confirmation?.payment ?? null,
    effectiveMethodId,
  );
  const activePaymentUrl = hasActivePayment
    ? (confirmation?.payment?.paymentUrl ?? null)
    : null;
  const hostedGatewayUrl =
    preparedPayment?.paymentUrl ?? activePaymentUrl ?? null;
  const resolvedTransferDetails = preparedPayment?.transfer ?? transferDetails;
  const resolvedQrValue =
    preparedPayment?.qrPayload ??
    (presentation.isHostedGateway ? (hostedGatewayUrl ?? "") : transferQrValue);
  const panelPaymentState = isPaymentSuccess
    ? "success"
    : isPaymentFailed || preparePaymentMutation.isError
      ? "failed"
      : preparePaymentMutation.isPending
        ? "loading"
        : "ready";
  const isUnauthorizedConfirmation =
    isAppError(confirmationError) && confirmationError.status === 401;
  const hasConfirmationError =
    !!confirmationError && !isUnauthorizedConfirmation;

  useEffect(() => {
    if (reservationId) return;
    void exitPurchaseFlow({ clearSession: true });
  }, [exitPurchaseFlow, reservationId]);

  useEffect(() => {
    if (!confirmationError || !isAppError(confirmationError)) return;
    if ([403, 404, 409].includes(confirmationError.status)) {
      syncToExpiry(new Date(0).toISOString());
    }
  }, [confirmationError, syncToExpiry]);

  useEffect(() => {
    if (!reservationExpiresAt) return;
    if (
      confirmation?.reservationStatus === RESERVATION_STATUS.PAYMENT_LOCKED &&
      confirmation.effectiveExpiresAt
    ) {
      refreshBuySessionDeadline(slug, confirmation.effectiveExpiresAt);
      replaceWithAuthoritativeExpiry(confirmation.effectiveExpiresAt);
      return;
    }

    syncToExpiry(reservationExpiresAt);
  }, [
    confirmation?.effectiveExpiresAt,
    confirmation?.reservationStatus,
    replaceWithAuthoritativeExpiry,
    reservationExpiresAt,
    slug,
    syncToExpiry,
  ]);

  useEffect(() => {
    if (!reservationId || !effectiveMethodId) return;
    if (
      !shouldPreparePayment({
        reservationId,
        methodId: effectiveMethodId,
        reservationStatus,
        payment: confirmation?.payment ?? null,
        preparedMethodId: preparedPayment?.methodId,
        isPreparing: preparePaymentMutation.isPending,
        prepareFailed: preparePaymentMutation.isError,
      })
    ) {
      return;
    }

    preparePaymentMutation.mutate({
      reservationId,
      methodId: effectiveMethodId,
      waitRoomToken: waitRoomToken ?? undefined,
    });
  }, [
    effectiveMethodId,
    confirmation?.payment,
    preparePaymentMutation,
    preparePaymentMutation.isError,
    preparePaymentMutation.isPending,
    preparedPayment?.methodId,
    reservationId,
    reservationStatus,
    waitRoomToken,
  ]);

  if (!reservationId || isConfirmationLoading) return null;

  if (isUnauthorizedConfirmation) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Session expired
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in again to continue your payment.
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => {
              if (typeof window === "undefined") return;
              const redirect =
                window.location.pathname + window.location.search;
              window.location.assign(
                `/auth/login?redirect=${encodeURIComponent(redirect)}`,
              );
            }}
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (hasConfirmationError || !deadline) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Confirmation unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not load your payment confirmation details. Please refresh
            this page and try again.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="flex-1 border-b border-border md:border-b-0 md:border-r md:w-3/5">
          <PaymentPanel
            deadline={deadline}
            totalAmount={
              preparedPayment?.amount ?? (reservationTotalAmount || total)
            }
            presentation={presentation}
            isHostedGateway={presentation.isHostedGateway}
            transferDetails={resolvedTransferDetails}
            transferQrValue={resolvedQrValue}
            paymentState={panelPaymentState}
            isPreparingGateway={preparePaymentMutation.isPending}
            gatewayError={
              preparePaymentMutation.isError
                ? "Could not prepare payment QR. Please refresh and try again."
                : null
            }
          />
        </div>
        <div className="bg-muted/20 md:w-2/5">
          <OrderSummarySidebar
            invoiceId={invoiceId}
            deadline={deadline}
            lineItems={lineItems}
            subtotal={subtotal}
            discount={
              discountCode?.valid
                ? {
                    code: discountCode.code,
                    amount: discountCode.discountAmount,
                  }
                : null
            }
            total={total}
          />
        </div>
      </div>
      <GatewayFooter providerName={presentation.label} />
    </div>
  );
}
