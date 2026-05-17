"use client";

import { useEffect, useMemo, useState, useId } from "react";
import { useBookingStore } from "@/lib/store/booking";
import { clearBuySession } from "@/lib/booking/buy-session";
import { useBuyProcessSession } from "@/hooks/use-buy-process-session";
import { createVNPayUrl } from "@/services/payment.service";
import {
  isReservationUnavailableError,
  useReservation,
} from "@/hooks/use-booking";
import { TimeoutModal } from "@/components/ticket-selection/timeout-modal";
import type { GatewayLineItem } from "@/schemas/payment-gateway";
import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import type { MapType } from "@/schemas/seat";
import type { TicketType } from "@/schemas/ticket-type";
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
    tickets,
    selectedSeats,
    ticketTypes,
    mapType,
    discountCode,
  } = useBookingStore();
  const { timedOut, syncToExpiry, exitPurchaseFlow } =
    useBuyProcessSession(slug);
  const {
    data: reservationResult,
    error: reservationError,
    isLoading: isReservationLoading,
  } = useReservation(reservationId ?? undefined);

  const uid = useId();
  const invoiceId = `INV-${SESSION_TIMESTAMP}-${uid.replace(/:/g, "")}`;

  const lineItems = useMemo(
    () => buildLineItems(tickets, selectedSeats, ticketTypes, mapType),
    [tickets, selectedSeats, ticketTypes, mapType],
  );

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountCode?.valid ? discountCode.discountAmount : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const [isPaying, setIsPaying] = useState(false);
  const reservationExpiresAt = reservationResult?.data?.expiresAt;
  const deadline = useMemo(
    () => (reservationExpiresAt ? new Date(reservationExpiresAt) : null),
    [reservationExpiresAt],
  );

  useEffect(() => {
    if (reservationId) return;
    clearBuySession(slug);
    exitPurchaseFlow();
  }, [exitPurchaseFlow, reservationId, slug]);

  useEffect(() => {
    if (!reservationError) return;
    if (isReservationUnavailableError(reservationError)) {
      syncToExpiry(new Date(0).toISOString());
    }
  }, [reservationError, syncToExpiry]);

  useEffect(() => {
    if (!reservationExpiresAt) return;
    syncToExpiry(reservationExpiresAt);
  }, [reservationExpiresAt, syncToExpiry]);

  const handlePay = async () => {
    if (!reservationId) return;
    const eventId = reservationResult?.data?.eventId;
    if (!eventId) return;

    setIsPaying(true);
    try {
      const response = await createVNPayUrl({
        reservationId,
        eventId,
        waitRoomToken: waitRoomToken ?? undefined,
      });
      window.location.href = response.paymentUrl;
    } catch {
      setIsPaying(false);
    }
  };

  if (!reservationId || !deadline || isReservationLoading) {
    return (
      <TimeoutModal
        open={timedOut}
        onOk={() => {
          clearBuySession(slug);
          exitPurchaseFlow();
        }}
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
            isPaying={isPaying}
            onPay={handlePay}
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
      <GatewayFooter />
      <TimeoutModal
        open={timedOut}
        onOk={() => {
          clearBuySession(slug);
          exitPurchaseFlow();
        }}
      />
    </div>
  );
}
