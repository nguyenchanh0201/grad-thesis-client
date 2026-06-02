"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { fmt } from "@/lib/strings/money";
import type { Reservation, ReservationStatus } from "@/schemas/reservation";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
};

function formatDateTime(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailDialog({ open, onOpenChange, reservation }: Props) {
  if (!reservation) {
    return null;
  }

  const status = STATUS_CONFIG[reservation.status];
  const event = reservation.event;
  const items = reservation.items ?? [];
  const currency = reservation.currency ?? "VND";
  const subtotal = reservation.subtotalAmount ?? reservation.totalAmount;
  const discount = reservation.voucher?.discountAmount ?? 0;
  const eventDate = formatDateTime(event?.eventDate);
  const createdAt = formatDateTime(reservation.createdAt);
  const expiresAt = formatDateTime(reservation.expiresAt);
  const paymentAction = getReservationPaymentAction({
    status: reservation.status,
    eventSlug: reservation.eventSlug,
    reservationId: reservation.id,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="line-clamp-2">
                {event?.eventName ?? "Order details"}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                Reservation #{reservation.id}
              </DialogDescription>
            </div>
            <Badge variant={status.variant} className="shrink-0">
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <section className="space-y-2">
            {eventDate && <DetailRow label="Event time" value={eventDate} />}
            {(event?.venueName || event?.city) && (
              <DetailRow
                label="Venue"
                value={[event?.venueName, event?.city]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
            {createdAt && <DetailRow label="Created" value={createdAt} />}
            {expiresAt && <DetailRow label="Expires" value={expiresAt} />}
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Tickets
            </p>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => {
                  const seat =
                    item.seatLabel ??
                    (item.row && item.column
                      ? `Row ${item.row}, Seat ${item.column}`
                      : null);

                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-sm border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{item.ticketTypeName}</p>
                        {seat && (
                          <p className="text-xs text-muted-foreground">
                            {seat}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Quantity {item.quantity}
                        </p>
                      </div>
                      <span className="shrink-0 font-medium">
                        {fmt(item.unitPrice * item.quantity)} {currency}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Ticket item details are not available for this order.
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-2">
            <DetailRow
              label="Subtotal"
              value={`${fmt(subtotal)} ${currency}`}
            />
            {reservation.voucher && (
              <>
                <DetailRow label="Voucher" value={reservation.voucher.code} />
                <DetailRow
                  label="Discount"
                  value={`-${fmt(discount)} ${currency}`}
                />
              </>
            )}
            <DetailRow
              label="Total"
              value={`${fmt(reservation.totalAmount)} ${currency}`}
              strong
            />
          </section>

          {reservation.recipient && (
            <>
              <Separator />
              <section className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Recipient
                </p>
                <DetailRow
                  label="Name"
                  value={reservation.recipient.fullName}
                />
                <DetailRow label="Email" value={reservation.recipient.email} />
                <DetailRow
                  label="Phone"
                  value={`${reservation.recipient.phoneCountryCode} ${reservation.recipient.phoneNumber}`}
                />
                {reservation.recipient.idPassport && (
                  <DetailRow
                    label="ID / Passport"
                    value={reservation.recipient.idPassport}
                  />
                )}
              </section>
            </>
          )}
        </div>

        {paymentAction && (
          <DialogFooter>
            <Button asChild>
              <Link href={paymentAction.href}>{paymentAction.label}</Link>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-right font-semibold" : "text-right"}>
        {value}
      </span>
    </div>
  );
}
