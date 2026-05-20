"use client";

import { useEffect, useMemo, useId } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isAppError } from "@/core/error";
import { RESERVATION_POLL_INTERVAL_MS } from "@/lib/booking/config";
import { useBookingStore } from "@/lib/store/booking";
import { clearBuySession } from "@/lib/booking/buy-session";
import {
  createVNPayUrl,
  getPaymentConfirmationStatus,
  getPaymentMethodsByEventSlug,
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
import { BookingResult } from "./booking-result";
import { PaymentPanel } from "./payment-pannel";
import { OrderSummarySidebar } from "./order-summary-sidebar";
import { GatewayFooter } from "./gateway-footer";

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
  const { syncToExpiry, exitPurchaseFlow } = useBuyProcess();
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

  const reservationExpiresAt = confirmation?.expiresAt;
  const reservationTotalAmount = Number(confirmation?.totalAmount ?? 0);
  const reservationStatus = confirmation?.reservationStatus;
  const eventId = confirmation?.eventId;
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
  const prepareGatewayMutation = useMutation({
    mutationFn: createVNPayUrl,
    retry: false,
  });
  const hostedGatewayUrl =
    confirmation?.payment?.paymentUrl ??
    prepareGatewayMutation.data?.paymentUrl ??
    null;
  const resolvedQrValue = presentation.isHostedGateway
    ? (hostedGatewayUrl ?? `PENDING:${paymentReference}`)
    : transferQrValue;

  useEffect(() => {
    if (reservationId) return;
    clearBuySession(slug);
    exitPurchaseFlow();
  }, [exitPurchaseFlow, reservationId, slug]);

  useEffect(() => {
    if (!confirmationError || !isAppError(confirmationError)) return;
    if ([403, 404, 409].includes(confirmationError.status)) {
      syncToExpiry(new Date(0).toISOString());
    }
  }, [confirmationError, syncToExpiry]);

  useEffect(() => {
    if (!reservationExpiresAt) return;
    syncToExpiry(reservationExpiresAt);
  }, [reservationExpiresAt, syncToExpiry]);

  useEffect(() => {
    if (!presentation.isHostedGateway) return;
    if (!reservationId || !eventId) return;
    if (isPaymentSuccess || isPaymentFailed) return;
    if (hostedGatewayUrl || prepareGatewayMutation.isPending) return;

    prepareGatewayMutation.mutate({
      reservationId,
      eventId,
      waitRoomToken: waitRoomToken ?? undefined,
    });
  }, [
    eventId,
    hostedGatewayUrl,
    isPaymentFailed,
    isPaymentSuccess,
    presentation.isHostedGateway,
    prepareGatewayMutation,
    reservationId,
    waitRoomToken,
  ]);

  if (!reservationId || !deadline || isConfirmationLoading) return null;
  if (isPaymentSuccess) {
    return (
      <BookingResult
        slug={slug}
        isSuccess
        invoiceId={paymentReference}
        amount={reservationTotalAmount || total}
      />
    );
  }
  if (isPaymentFailed) {
    return (
      <BookingResult
        slug={slug}
        isSuccess={false}
        invoiceId={paymentReference}
        amount={reservationTotalAmount || total}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col">
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="flex-1 border-b border-border md:border-b-0 md:border-r md:w-3/5">
          <PaymentPanel
            deadline={deadline}
            totalAmount={total}
            presentation={presentation}
            isHostedGateway={presentation.isHostedGateway}
            transferDetails={transferDetails}
            transferQrValue={resolvedQrValue}
            isPreparingGateway={prepareGatewayMutation.isPending}
            gatewayError={
              prepareGatewayMutation.isError
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
