"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, MapPin, Ticket, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/strings/money";
import { BackendTicket, BackendTicketStatus } from "@/schemas/ticket";
import { TicketQRModal } from "./ticket-qr-modal";

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

type Props = { ticket: BackendTicket };

export function TicketCard({ ticket }: Props) {
  const [qrOpen, setQrOpen] = useState(false);
  const { event, seat, ticketType, status, code } = ticket;
  const { label: statusLabel, variant: statusVariant } = STATUS_CONFIG[status];
  const canShowQR =
    status === BackendTicketStatus.VALID || status === BackendTicketStatus.USED;

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
  const seatLabel = seat
    ? `Row ${seat.row}, Seat ${seat.column}`
    : ticketType.name;

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-sm border border-border transition-shadow hover:shadow-md sm:flex-row">
        {/* Image — banner on mobile, sidebar on desktop */}
        <div className="relative aspect-5/2 w-full shrink-0 sm:aspect-auto sm:w-44 sm:self-stretch">
          {event.featuredImageUrl ? (
            <Image
              src={event.featuredImageUrl}
              alt={event.eventName}
              fill
              sizes="(max-width: 640px) 100vw, 176px"
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full bg-muted" />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          {/* Ticket type + status */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {ticketType.name}
            </p>
            <Badge variant={statusVariant} className="shrink-0">
              {statusLabel}
            </Badge>
          </div>

          {/* Event title */}
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

          {/* Seat / zone + code */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Ticket className="h-3.5 w-3.5 shrink-0" />
              <span>{seatLabel}</span>
            </div>
            <span className="ml-auto font-mono text-xs text-muted-foreground/70">
              {code}
            </span>
          </div>

          {/* Price + action */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-bold text-primary">
              {formatPrice(ticketType.price, ticketType.currency)}
            </span>
            {canShowQR && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setQrOpen(true)}
              >
                <QrCode className="h-4 w-4" />
                Show QR
              </Button>
            )}
          </div>
        </div>
      </article>

      <TicketQRModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        ticket={ticket}
      />
    </>
  );
}
