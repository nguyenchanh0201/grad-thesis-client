"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, ChevronDown, ChevronUp, MapPin, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/strings/money";
import { BackendTicket, BackendTicketStatus } from "@/schemas/ticket";
import { TicketQRModal } from "./ticket-qr-modal";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";

const STATUS_CONFIG: Record<
  BackendTicketStatus,
  {
    label: string;
    variant: "success" | "warning" | "secondary" | "destructive";
  }
> = {
  [BackendTicketStatus.VALID]: { label: "Valid", variant: "success" },
  [BackendTicketStatus.USED]: { label: "Used", variant: "secondary" },
  [BackendTicketStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "destructive",
  },
  [BackendTicketStatus.TRANSFERRED]: {
    label: "Transferred",
    variant: "warning",
  },
};

type Props = {
  tickets: BackendTicket[];
  onOpenDetails: (tickets: BackendTicket[]) => void;
};

export function TicketGroupCard({ tickets, onOpenDetails }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [qrTicket, setQrTicket] = useState<BackendTicket | null>(null);

  const event = tickets[0].event;
  const order = tickets[0].order;

  // e.g. "2x GA - 1x VIP"
  const typeCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.ticketType.name] = (acc[t.ticketType.name] ?? 0) + 1;
    return acc;
  }, {});
  const typeSummary = Object.entries(typeCounts)
    .map(([name, n]) => `${n}x ${name}`)
    .join(" - ");

  const total = tickets.reduce((sum, t) => sum + Number(t.ticketType.price), 0);
  const currency = tickets[0].ticketType.currency;

  const validCount = tickets.filter(
    (t) => t.status === BackendTicketStatus.VALID,
  ).length;
  const usedCount = tickets.filter(
    (t) => t.status === BackendTicketStatus.USED,
  ).length;
  const cancelledCount = tickets.filter(
    (t) => t.status === BackendTicketStatus.CANCELLED,
  ).length;
  const transferredCount = tickets.filter(
    (t) => t.status === BackendTicketStatus.TRANSFERRED,
  ).length;

  const eventDt = new Date(event.eventDate);
  const dateStr = eventDt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = eventDt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <article className="relative overflow-hidden rounded-sm border border-border transition-shadow hover:shadow-md">
        <button
          type="button"
          aria-label={`View ticket details for ${event.eventName}`}
          className="absolute inset-0 z-10 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          onClick={() => onOpenDetails(tickets)}
        />

        {/* Card header, always visible */}
        <div className="pointer-events-none relative z-20 flex flex-col sm:flex-row">
          {/* Event image */}
          <div className="relative aspect-5/2 w-full shrink-0 sm:aspect-auto sm:w-44 sm:self-stretch">
            {event.featuredImageUrl ? (
              <Image
                src={event.featuredImageUrl}
                alt={event.eventName}
                fill
                sizes="(max-width: 640px) 100vw, 176px"
                className="object-cover"
                unoptimized={isSvgImageSource(event.featuredImageUrl)}
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            {/* Type summary + status badges */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {order ? `${typeSummary} - ${order.orderNumber}` : typeSummary}
              </p>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                {validCount > 0 && (
                  <Badge variant="success">{validCount} Valid</Badge>
                )}
                {usedCount > 0 && (
                  <Badge variant="secondary">{usedCount} Used</Badge>
                )}
                {transferredCount > 0 && (
                  <Badge variant="warning">
                    {transferredCount} Transferred
                  </Badge>
                )}
                {cancelledCount > 0 && (
                  <Badge variant="destructive">
                    {cancelledCount} Cancelled
                  </Badge>
                )}
              </div>
            </div>

            {/* Event name */}
            <p className="line-clamp-2 text-base font-bold leading-snug text-foreground">
              {event.eventName}
            </p>

            {/* Date + Venue */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {dateStr} at {timeStr}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {event.venue.venueName}
                  {event.venue.city ? `, ${event.venue.city}` : ""}
                </span>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Total + expand toggle */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-bold text-primary">
                {fmt(total)} {currency}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="pointer-events-auto relative z-30 gap-1.5"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded individual ticket rows */}
        {expanded && (
          <div className="pointer-events-none relative z-20 divide-y divide-border border-t border-border">
            {tickets.map((ticket) => {
              const { label: statusLabel, variant: statusVariant } =
                STATUS_CONFIG[ticket.status];
              const canShowQR =
                ticket.status === BackendTicketStatus.VALID ||
                ticket.status === BackendTicketStatus.USED;

              return (
                <div
                  key={ticket.id}
                  className="flex items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {ticket.ticketType.name}
                      {ticket.seat && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Row {ticket.seat.row}, Seat {ticket.seat.column}
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {ticket.code}
                    </p>
                  </div>
                  <Badge variant={statusVariant} className="shrink-0">
                    {statusLabel}
                  </Badge>
                  {canShowQR && (
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Show QR code"
                      className="pointer-events-auto relative z-30"
                      onClick={() => setQrTicket(ticket)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </article>

      {qrTicket && (
        <TicketQRModal
          open
          onClose={() => setQrTicket(null)}
          ticket={qrTicket}
        />
      )}
    </>
  );
}
