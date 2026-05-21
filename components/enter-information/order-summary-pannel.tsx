"use client";

import Image from "next/image";
import {
  Calendar,
  IdCard,
  Mail,
  MapPin,
  Phone,
  TicketCheck,
  User,
} from "lucide-react";
import { CollapsibleSection } from "./collapsible-section";
import { fmt } from "@/lib/strings/money";
import type { SelectedTicket } from "@/schemas/seat/types";
import type { SelectedSeat } from "@/components/ticket-selection/seat-map";
import type { RecipientInfo, EventSummary } from "../../schemas/booking/types";
import { MapType } from "@/schemas/seat";
import { OrderInfo } from "./order-info";
import type { TicketType } from "@/schemas/ticket-type";
import type { ReservationItem } from "@/schemas/reservation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  event: EventSummary;
  ticketTypes: TicketType[];
  tickets: SelectedTicket[];
  selectedSeats: SelectedSeat[];
  mapType: MapType;
  recipient: RecipientInfo;
  reservationItems?: ReservationItem[];
  reservationTotalAmount?: number;
  reservationSubtotalAmount?: number;
  reservationCurrency?: string;
  discount?: { code: string; amount: number } | null;
};

type SeatRow = {
  label: string;
  quantity: number;
  unitPrice: number;
  currency: string;
};

function buildSeatRows(
  tickets: SelectedTicket[],
  selectedSeats: SelectedSeat[],
  ticketTypes: TicketType[],
  mapType: MapType,
): SeatRow[] {
  if (mapType === "zone") {
    return tickets.map((t) => {
      const tt = ticketTypes.find((x) => x.id === t.ticketTypeId);
      return {
        label: tt?.name ?? t.ticketTypeId,
        quantity: t.quantity,
        unitPrice: tt?.price ?? 0,
        currency: tt?.currency ?? "VND",
      };
    });
  }
  const byType = new Map<string, number>();
  selectedSeats.forEach((s) =>
    byType.set(s.ticketTypeId, (byType.get(s.ticketTypeId) ?? 0) + 1),
  );
  return Array.from(byType.entries()).map(([ticketTypeId, count]) => {
    const tt = ticketTypes.find((x) => x.id === ticketTypeId);
    return {
      label: tt?.name ?? ticketTypeId,
      quantity: count,
      unitPrice: tt?.price ?? 0,
      currency: tt?.currency ?? "VND",
    };
  });
}

function computeTotal(rows: SeatRow[]): number {
  return rows.reduce((sum, r) => sum + r.unitPrice * r.quantity, 0);
}

function buildReservationRows(items: ReservationItem[] = []): SeatRow[] {
  const rowsByTicketType = new Map<string, SeatRow>();

  items.forEach((item) => {
    const key = `${item.ticketTypeId}:${item.unitPrice}`;
    const existing = rowsByTicketType.get(key);

    if (existing) {
      existing.quantity += item.quantity;
      return;
    }

    rowsByTicketType.set(key, {
      label: item.ticketTypeName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: "VND",
    });
  });

  return Array.from(rowsByTicketType.values());
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value?: string;
}) {
  return (
    <div className="grid grid-cols-[1rem_5rem_1fr] items-start gap-2 text-sm">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      {value ? (
        <span className="wrap-break-word font-medium text-foreground">
          {value}
        </span>
      ) : (
        <span className="italic text-muted-foreground/70">Not filled</span>
      )}
    </div>
  );
}

export function OrderSummaryPanel({
  event,
  ticketTypes,
  tickets,
  selectedSeats,
  mapType,
  recipient,
  reservationItems,
  reservationTotalAmount,
  reservationSubtotalAmount,
  reservationCurrency,
  discount,
}: Props) {
  const reservationRows = buildReservationRows(reservationItems);
  const seatRows =
    reservationRows.length > 0
      ? reservationRows
      : buildSeatRows(tickets, selectedSeats, ticketTypes, mapType);
  const currency = reservationCurrency ?? seatRows[0]?.currency ?? "VND";
  const computedSubtotal = computeTotal(seatRows);
  const subtotal = reservationSubtotalAmount ?? computedSubtotal;
  const total =
    reservationTotalAmount ??
    (discount?.amount ? Math.max(0, subtotal - discount.amount) : subtotal);

  return (
    <div className="flex flex-col">
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

      <CollapsibleSection title="Ticket Delivery Info">
        <div className="space-y-3 text-sm">
          <Card size="sm" className="gap-3 bg-muted/35">
            <CardHeader className="grid-cols-[1fr_auto] items-center">
              <CardTitle className="flex items-center gap-2">
                <TicketCheck className="size-4 text-primary" />
                Receipt information
              </CardTitle>
              <Badge
                variant={
                  recipient.fullName && recipient.email ? "success" : "outline"
                }
              >
                {recipient.fullName && recipient.email ? "Ready" : "Missing"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <DetailRow
                  icon={User}
                  label="Name"
                  value={recipient.fullName}
                />
                <DetailRow icon={Mail} label="Email" value={recipient.email} />
                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={
                    recipient.phoneNumber
                      ? `${recipient.phoneCountryCode} ${recipient.phoneNumber}`
                      : undefined
                  }
                />
                <DetailRow
                  icon={IdCard}
                  label="ID"
                  value={recipient.idPassport}
                />
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Receive online tickets via email and/or physical tickets at
                  event
                </p>
                <p className="text-xs text-muted-foreground">
                  E-tickets will be sent to your email. Physical tickets (if
                  applicable) may be collected at the venue on event day.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

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
                  <span className="text-muted-foreground">x{row.quantity}</span>
                  <span className="font-medium text-primary">
                    {fmt(row.unitPrice)} {row.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Payment Information"
        rightSlot={
          <span className="text-sm font-bold text-primary">
            {fmt(total)} {currency}
          </span>
        }
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-foreground">
              {fmt(subtotal)} {currency}
            </span>
          </div>
          {discount?.amount ? (
            <div className="flex items-center justify-between text-green-600">
              <span>Discount ({discount.code})</span>
              <span className="font-medium">
                -{fmt(discount.amount)} {currency}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <span className="text-primary">
              {fmt(total)} {currency}
            </span>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
