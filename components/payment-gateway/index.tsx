"use client";

import { useEffect, useMemo, useState, useId } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/lib/store/booking";
import {
  hasBuySession,
  getBuySessionDeadline,
} from "@/lib/booking/buy-session";
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
  const router = useRouter();
  const { tickets, selectedSeats, ticketTypes, mapType, discountCode } =
    useBookingStore();

  const [authorized] = useState(() => hasBuySession(slug));
  const [deadline] = useState<Date | null>(() => getBuySessionDeadline(slug));

  useEffect(() => {
    if (!hasBuySession(slug)) {
      router.replace(`/events/${slug}`);
    }
  }, [slug, router]);

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

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const res = await fetch("/api/payment/vnpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, amount: total, slug }),
      });
      const { paymentUrl } = await res.json();
      window.location.href = paymentUrl;
    } catch {
      setIsPaying(false);
    }
  };

  if (!authorized || !deadline) return null;

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
    </div>
  );
}
