"use client";

import Image from "next/image";
import { Calendar, MapPin } from "lucide-react";
import { CollapsibleSection } from "./collapsible-section";
import { fmt } from "@/lib/strings/money";
import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import type { RecipientInfo, EventSummary } from "../../schemas/booking/types";
import { MapType, Zone } from "@/schemas/seat";
import { OrderInfo } from "./order-info";

type Props = {
  event: EventSummary;
  zones: Zone[];
  tickets: SelectedTicket[];
  selectedSeats: SelectedSeat[];
  mapType: MapType;
  recipient: RecipientInfo;
  discount?: { code: string; amount: number } | null;
};

type SeatRow = { label: string; quantity: number; unitPrice: number };

function buildSeatRows(
  tickets: SelectedTicket[],
  selectedSeats: SelectedSeat[],
  zones: Zone[],
  mapType: MapType,
): SeatRow[] {
  if (mapType === "zone") {
    return tickets.map((t) => {
      const zone = zones.find((z) => z.id === t.zoneId);
      return {
        label: zone?.label ?? t.zoneId,
        quantity: t.quantity,
        unitPrice: zone?.price ?? 0,
      };
    });
  }
  const byZone = new Map<string, number>();
  selectedSeats.forEach((s) =>
    byZone.set(s.zoneId, (byZone.get(s.zoneId) ?? 0) + 1),
  );
  return Array.from(byZone.entries()).map(([zoneId, count]) => {
    const zone = zones.find((z) => z.id === zoneId);
    return {
      label: zone?.label ?? zoneId,
      quantity: count,
      unitPrice: zone?.price ?? 0,
    };
  });
}

function computeTotal(rows: SeatRow[]): number {
  return rows.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);
}

export function OrderSummaryPanel({
  event,
  zones,
  tickets,
  selectedSeats,
  mapType,
  recipient,
  discount,
}: Props) {
  const seatRows = buildSeatRows(tickets, selectedSeats, zones, mapType);
  const subtotal = computeTotal(seatRows);
  const total = discount?.amount
    ? Math.max(0, subtotal - discount.amount)
    : subtotal;

  return (
    <div className="flex flex-col">
      {/* Event card */}
      <div className="p-5">
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-sm bg-muted">
          {event.image && (
            <Image
              src={event.image}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        <h2 className="mt-4 text-xl font-bold leading-tight text-foreground">
          {event.title}
        </h2>
        <div className="mt-3 space-y-1.5">
          <OrderInfo icon={Calendar} title={event.dateLabel} />
          <OrderInfo icon={MapPin} title={event.venueAddress} />
        </div>
      </div>

      {/* Ticket Delivery Info */}
      <CollapsibleSection title="Ticket Delivery Info">
        <div className="space-y-3 text-sm">
          <div className="space-y-1 rounded-sm bg-muted/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Customer Information
            </p>
            <p>
              <span className="text-muted-foreground">Name: </span>
              {recipient.fullName ? (
                <span className="text-foreground">{recipient.fullName}</span>
              ) : (
                <span className="italic text-muted-foreground/60">
                  Not filled
                </span>
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Email: </span>
              {recipient.email ? (
                <span className="text-foreground">{recipient.email}</span>
              ) : (
                <span className="italic text-muted-foreground/60">
                  Not filled
                </span>
              )}
            </p>
            {recipient.phoneNumber && (
              <p>
                <span className="text-muted-foreground">Phone: </span>
                <span className="text-foreground">
                  {recipient.phoneCountryCode} {recipient.phoneNumber}
                </span>
              </p>
            )}
            {recipient.idPassport && (
              <p>
                <span className="text-muted-foreground">ID / Passport: </span>
                <span className="text-foreground">{recipient.idPassport}</span>
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Receive online tickets via email and/or physical tickets at event
            </p>
            <p className="text-xs text-muted-foreground">
              E-tickets will be sent to your email. Physical tickets (if
              applicable) may be collected at the venue on event day.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Seating Area & Tickets */}
      <CollapsibleSection title="Seating Area & Tickets">
        {seatRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets selected</p>
        ) : (
          <div className="divide-y divide-border">
            {seatRows.map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-medium text-foreground">{row.label}</span>
                <div className="flex items-center gap-4 text-right">
                  <span className="text-muted-foreground">×{row.quantity}</span>
                  <span className="font-medium text-primary">
                    {fmt(row.unitPrice)} VND
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Payment Information */}
      <CollapsibleSection
        title="Payment Information"
        rightSlot={
          <span className="text-sm font-bold text-primary">
            {fmt(total)} VND
          </span>
        }
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">
              {fmt(subtotal)} VND
            </span>
          </div>
          {discount?.amount ? (
            <div className="flex items-center justify-between text-green-600">
              <span>Discount ({discount.code})</span>
              <span className="font-medium">−{fmt(discount.amount)} VND</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span className="text-primary">{fmt(total)} VND</span>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
