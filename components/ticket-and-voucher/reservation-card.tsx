"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/strings/money";
import { Reservation, ReservationStatus } from "@/schemas/reservation";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";
import { getReservationPaymentAction } from "./reservation-actions";

const STATUS_CONFIG: Record<
  ReservationStatus,
  {
    label: string;
    variant: "success" | "warning" | "secondary" | "destructive";
  }
> = {
  PENDING: { label: "Pending Payment", variant: "warning" },
  PAYMENT_LOCKED: { label: "Processing", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

type Props = {
  reservation: Reservation;
  onOpenDetails: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  isCanceling?: boolean;
};

export function ReservationCard({
  reservation,
  onOpenDetails,
  onCancel,
  isCanceling = false,
}: Props) {
  const { status, totalAmount, currency, event, eventSlug } = reservation;
  const { label: statusLabel, variant: statusVariant } = STATUS_CONFIG[status];
  const paymentAction = getReservationPaymentAction({
    status,
    eventSlug,
    reservationId: reservation.id,
  });
  const canCancel = status === "PENDING" || status === "PAYMENT_LOCKED";

  const eventDt = event?.eventDate ? new Date(event.eventDate) : null;
  const dateStr = eventDt
    ? eventDt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const timeStr = eventDt
    ? eventDt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <article
      id={`reservation-${reservation.id}`}
      className="relative flex flex-col overflow-hidden rounded-sm border border-border transition-shadow hover:shadow-md sm:flex-row"
    >
      <button
        type="button"
        aria-label={`View order details for ${event?.eventName ?? "event"}`}
        className="absolute inset-0 z-10 cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onClick={() => onOpenDetails(reservation)}
      />

      <div className="pointer-events-none relative z-20 aspect-5/2 w-full shrink-0 sm:aspect-auto sm:w-44 sm:self-stretch">
        {event?.featuredImageUrl ? (
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

      <div className="pointer-events-none relative z-20 flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reservation
          </p>
          <Badge variant={statusVariant} className="shrink-0">
            {statusLabel}
          </Badge>
        </div>

        <p className="line-clamp-2 text-base font-bold leading-snug text-foreground">
          {event?.eventName ?? "Event"}
        </p>

        {dateStr && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>
                {dateStr} at {timeStr}
              </span>
            </div>
            {event?.venueName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {event.venueName}
                  {event.city ? `, ${event.city}` : ""}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border" />

        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-bold text-primary">
            {fmt(totalAmount)} {currency ?? "VND"}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {canCancel && onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="pointer-events-auto relative z-30"
                disabled={isCanceling}
                onClick={() => onCancel(reservation)}
              >
                {isCanceling ? "Canceling..." : "Cancel"}
              </Button>
            )}
            {paymentAction && (
              <Button
                asChild
                variant="default"
                size="sm"
                className="pointer-events-auto relative z-30"
              >
                <Link href={paymentAction.href}>{paymentAction.label}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
