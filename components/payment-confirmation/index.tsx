"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Hash,
  Mail,
  MapPin,
  Tag,
  Ticket,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { isAppError } from "@/core/error";
import { isSvgImageSource } from "@/lib/image/is-svg-image-source";
import { fmt } from "@/lib/strings/money";
import { clearBuySession } from "@/lib/booking/buy-session";
import { useBookingStore } from "@/lib/store/booking";
import { getEventBySlug } from "@/services/event.service";
import { getPaymentConfirmationStatus } from "@/services/payment.service";
import { getReservation } from "@/services/reservation.service";
import { RESERVATION_STATUS } from "@/schemas/reservation/reservation.schema";
import { Button } from "@/components/ui/button";

const ANIM = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
  @keyframes tc-rise  { from { opacity:0; transform:translateY(24px) scale(.97); } to { opacity:1; transform:none; } }
  @keyframes tc-slide { from { opacity:0; transform:translateY(8px); }             to { opacity:1; transform:none; } }
  @keyframes tc-draw  { to { stroke-dashoffset:0; } }
  @keyframes tc-spin  { to { transform:rotate(360deg); } }
  @keyframes tc-pulse { 0%,100% { opacity:.35; } 50% { opacity:.75; } }
  .tc-s1       { animation: tc-rise  .5s  cubic-bezier(.16,1,.3,1) .05s both; }
  .tc-s2       { animation: tc-slide .4s  ease .25s both; }
  .tc-s3       { animation: tc-slide .4s  ease .5s  both; }
  .tc-ring     { stroke-dasharray:151; stroke-dashoffset:151; animation: tc-draw .7s cubic-bezier(.16,1,.3,1) .3s both; }
  .tc-tick     { stroke-dasharray:36;  stroke-dashoffset:36;  animation: tc-draw .4s cubic-bezier(.16,1,.3,1) .9s both; }
  .tc-xa       { stroke-dasharray:24;  stroke-dashoffset:24;  animation: tc-draw .3s ease .7s both; }
  .tc-xb       { stroke-dasharray:24;  stroke-dashoffset:24;  animation: tc-draw .3s ease .9s both; }
  .tc-spin     { animation: tc-spin  1.2s linear infinite; }
  .tc-pulse    { animation: tc-pulse 2s   ease  infinite; }
  .tc-playfair { font-family: 'Playfair Display', Georgia, serif; }
`;

// Centered layout for non-success states
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-4 py-10">
      <style>{ANIM}</style>
      <div className="w-full max-w-105">{children}</div>
    </div>
  );
}

function SimpleCard({ children }: { children: ReactNode }) {
  return (
    <div className="tc-s1 rounded-xl border border-border bg-card px-6 py-10 text-center shadow-sm">
      {children}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
      <span className="min-w-0 break-words text-sm text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`tc-pulse rounded bg-muted ${className ?? ""}`} />;
}

type Props = { slug?: string };

function extractReservationId(txnRef: string | null): string | null {
  if (!txnRef) return null;
  const match = txnRef.match(/^(\d+)-/);
  return match?.[1] ?? null;
}

export function PaymentConfirmation({ slug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInvalidChecksum =
    searchParams.get("paymentStatus") === "invalid_checksum";
  const isFailedFromQuery = searchParams.get("paymentStatus") === "failed";
  const isCancelledFromQuery =
    searchParams.get("paymentStatus") === "cancelled";
  const slugFromQuery = searchParams.get("slug");
  const resolvedSlug = slug ?? slugFromQuery ?? null;

  const {
    reservationId: storeReservationId,
    setReservationId,
    reset,
    tickets: storeTickets,
    selectedSeats: storeSeats,
    ticketTypes: storeTicketTypes,
  } = useBookingStore();

  const reservationIdFromQuery =
    searchParams.get("orderId") ??
    searchParams.get("reservationId") ??
    extractReservationId(searchParams.get("vnp_TxnRef"));
  const reservationId = reservationIdFromQuery ?? storeReservationId;

  useEffect(() => {
    if (!reservationIdFromQuery || storeReservationId) return;
    setReservationId(reservationIdFromQuery);
  }, [reservationIdFromQuery, setReservationId, storeReservationId]);

  // Payment status
  const { data, error, isLoading } = useQuery({
    queryKey: ["payment-confirmation", reservationId],
    queryFn: () => getPaymentConfirmationStatus(reservationId!),
    enabled:
      !!reservationId &&
      !isFailedFromQuery &&
      !isCancelledFromQuery &&
      !isInvalidChecksum,
    retry: false,
    refetchInterval: 5000,
  });

  const state = useMemo(() => {
    if (isFailedFromQuery) return "failed";
    if (isCancelledFromQuery) return "cancelled";
    if (!data) return null;
    if (data.reservationStatus === RESERVATION_STATUS.PAID) return "success";
    if (data.reservationStatus === RESERVATION_STATUS.CANCELLED)
      return "cancelled";
    if (data.reservationStatus === RESERVATION_STATUS.EXPIRED) return "expired";
    if (data.payment?.status === "FAILED") return "failed";
    return "pending";
  }, [data, isFailedFromQuery, isCancelledFromQuery]);

  // Event detail — use eventSlug from payment response, fall back to route slug
  const eventSlug = data?.eventSlug ?? resolvedSlug;
  const { data: eventDetail, isLoading: isEventLoading } = useQuery({
    queryKey: ["confirmation-event", eventSlug],
    queryFn: () => getEventBySlug(eventSlug!),
    enabled: !!eventSlug && state === "success",
    retry: false,
    select: (res) => res.data,
  });

  // Reservation detail — for ticket items, recipient, voucher
  const { data: reservation, isLoading: isReservationLoading } = useQuery({
    queryKey: ["reservation-detail", reservationId],
    queryFn: () => getReservation(reservationId!),
    enabled: !!reservationId && state === "success",
    retry: false,
    select: (res) => res.data,
  });

  const handleExitFlow = () => {
    if (resolvedSlug) clearBuySession(resolvedSlug);
    reset();
  };

  const eventRoute = resolvedSlug ? `/events/${resolvedSlug}` : "/events";
  const backLabel = resolvedSlug ? "Back to event" : "Browse events";

  if (isInvalidChecksum) {
    return (
      <Shell>
        <SimpleCard>
          <div className="mb-5 inline-flex text-destructive">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle
                cx="26"
                cy="26"
                r="24"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity=".4"
              />
              <path
                className="tc-xa"
                d="M18 18L34 34"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                className="tc-xb"
                d="M34 18L18 34"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-destructive">
            Verification Failed
          </div>
          <div className="text-xl font-bold text-foreground">
            Payment verification failed
          </div>
          <p className="mt-2 line-clamp-none text-sm leading-relaxed text-muted-foreground">
            We could not verify the payment callback. Please check your orders
            before trying again.
          </p>
          <Button
            className="mt-7 w-full"
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            {backLabel}
          </Button>
        </SimpleCard>
      </Shell>
    );
  }

  if (isFailedFromQuery || isCancelledFromQuery) {
    const title = isCancelledFromQuery
      ? "Reservation cancelled"
      : "Payment failed";
    const statusLabel = isCancelledFromQuery ? "Cancelled" : "Failed";
    const description = isCancelledFromQuery
      ? "This reservation was cancelled."
      : "The payment was not completed. You can start a new booking if you'd like to try again.";

    return (
      <Shell>
        <SimpleCard>
          <div className="mb-5 inline-flex text-destructive">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle
                cx="26"
                cy="26"
                r="24"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity=".4"
              />
              <path
                className="tc-xa"
                d="M18 18L34 34"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                className="tc-xb"
                d="M34 18L18 34"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-destructive">
            {statusLabel}
          </div>
          <div className="text-xl font-bold text-foreground">{title}</div>
          <p className="mt-2 line-clamp-none text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          <Button
            className="mt-7 w-full"
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            {backLabel}
          </Button>
        </SimpleCard>
      </Shell>
    );
  }

  if (!reservationId) {
    return (
      <Shell>
        <SimpleCard>
          <div className="mb-5 inline-flex text-muted-foreground opacity-40">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M24 14v11M24 31v2"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-xl font-bold text-foreground">
            Confirmation unavailable
          </div>
          <p className="mt-2 line-clamp-none text-sm leading-relaxed text-muted-foreground">
            Missing reservation information for payment confirmation.
          </p>
          <Button
            className="mt-7 w-full"
            onClick={() => router.replace(eventRoute)}
          >
            {backLabel}
          </Button>
        </SimpleCard>
      </Shell>
    );
  }

  if (isLoading || (!data && !error)) {
    return (
      <Shell>
        <SimpleCard>
          <div className="mb-5 inline-flex text-info">
            <svg
              className="tc-spin"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
            >
              <circle
                cx="22"
                cy="22"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
                opacity=".2"
              />
              <path
                d="M22 2a20 20 0 0 1 20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-xl font-bold text-foreground">
            Confirming payment…
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            We are checking your payment status.
          </p>
        </SimpleCard>
      </Shell>
    );
  }

  if (error && isAppError(error) && error.status === 401) {
    return (
      <Shell>
        <SimpleCard>
          <div className="mb-5 inline-flex text-destructive">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity=".4"
              />
              <path
                d="M24 14v11M24 31v2"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-destructive">
            Session Expired
          </div>
          <div className="text-xl font-bold text-foreground">
            Please sign in again
          </div>
          <p className="mt-2 line-clamp-none text-sm leading-relaxed text-muted-foreground">
            Your session expired. Sign in to check your payment status.
          </p>
          <Button
            className="mt-7 w-full"
            onClick={() =>
              router.replace(
                `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
              )
            }
          >
            Sign in
          </Button>
        </SimpleCard>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <SimpleCard>
          <div className="mb-5 inline-flex text-destructive">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle
                cx="26"
                cy="26"
                r="24"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity=".4"
              />
              <path
                className="tc-xa"
                d="M18 18L34 34"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                className="tc-xb"
                d="M34 18L18 34"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-xl font-bold text-foreground">
            Confirmation unavailable
          </div>
          <p className="mt-2 line-clamp-none text-sm leading-relaxed text-muted-foreground">
            Could not load payment status. Please check your orders or contact
            support if money was deducted.
          </p>
          <Button
            className="mt-7 w-full"
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            {backLabel}
          </Button>
        </SimpleCard>
      </Shell>
    );
  }

  if (state === "success") {
    // Event detail
    const venue = eventDetail?.venue;
    const eventDt = eventDetail?.eventDate
      ? new Date(eventDetail.eventDate)
      : null;
    const dateStr = eventDt?.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = eventDt?.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const venueStr = [venue?.venueName, venue?.city].filter(Boolean).join(", ");
    const addressStr = venue?.address ?? null;

    // Booking detail
    const recipient = reservation?.recipient;
    const bookedDt = reservation?.createdAt
      ? new Date(reservation.createdAt)
      : null;
    const bookedStr = bookedDt?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Line items — use API data first, fall back to booking store
    type LineItem = {
      name: string;
      quantity: number;
      unitPrice: number;
      seatLabel?: string;
    };
    const hasSeats = reservation?.items?.some(
      (item) => item.seatLabel || item.row,
    );

    const lineItems: LineItem[] = reservation?.items?.length
      ? hasSeats
        ? reservation.items.map((item) => ({
            name: item.ticketTypeName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            seatLabel:
              item.seatLabel ??
              (item.row && item.column
                ? `${item.row}${item.column}`
                : undefined),
          }))
        : reservation.items.reduce<LineItem[]>((acc, item) => {
            const existing = acc.find((x) => x.name === item.ticketTypeName);
            if (existing) {
              existing.quantity += item.quantity;
            } else {
              acc.push({
                name: item.ticketTypeName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              });
            }
            return acc;
          }, [])
      : storeTickets.length > 0
        ? storeTickets
            .map((t) => {
              const tt = storeTicketTypes.find((x) => x.id === t.ticketTypeId);
              return tt
                ? { name: tt.name, quantity: t.quantity, unitPrice: tt.price }
                : null;
            })
            .filter((x): x is LineItem => x !== null)
        : storeSeats.reduce<LineItem[]>((acc, seat) => {
            const tt = storeTicketTypes.find((x) => x.id === seat.ticketTypeId);
            if (!tt) return acc;
            const existing = acc.find((x) => x.name === tt.name);
            if (existing) existing.quantity += 1;
            else acc.push({ name: tt.name, quantity: 1, unitPrice: tt.price });
            return acc;
          }, []);

    const voucher = reservation?.voucher;
    const subtotal = reservation?.subtotalAmount;
    const hasDiscount =
      voucher && subtotal !== undefined && subtotal !== data!.totalAmount;

    return (
      <div
        data-testid="payment-confirmation"
        data-status="PAID"
        data-reservation-id={reservationId}
        className="min-h-[calc(100vh-var(--header-height))] bg-muted/30 py-8 md:py-12"
      >
        <style>{ANIM}</style>
        <div className="page-container">
          <div className="mx-auto max-w-3xl space-y-5">
            {/* ── STATE ─────────────────────────────────────────────────────── */}
            <div className="tc-s1 flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-7 text-center shadow-sm">
              <div className="text-success">
                <svg width="48" height="48" viewBox="0 0 52 52" fill="none">
                  <circle
                    className="tc-ring"
                    cx="26"
                    cy="26"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    className="tc-tick"
                    d="M15 27l7 7 15-15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-success">
                  Payment Confirmed
                </div>
                <div className="tc-playfair mt-0.5 text-2xl font-bold text-foreground">
                  You&apos;re all set
                </div>
                <p className="mt-1 line-clamp-none text-sm text-muted-foreground">
                  Tickets are being issued to your account
                </p>
              </div>
            </div>

            {/* ── EVENT + TICKETS ────────────────────────────────────────────── */}
            <div className="tc-s2 grid grid-cols-1 gap-5 md:grid-cols-2 md:items-stretch">
              {/* LEFT: Event detail */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {/* Featured image */}
                {isEventLoading ? (
                  <div className="aspect-video w-full bg-muted" />
                ) : eventDetail?.featuredImageUrl ? (
                  <div className="relative aspect-video w-full">
                    <Image
                      src={eventDetail.featuredImageUrl}
                      alt={eventDetail.eventName}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized={isSvgImageSource(
                        eventDetail.featuredImageUrl,
                      )}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-muted" />
                )}

                <div className="space-y-4 p-5">
                  {/* Event name */}
                  {isEventLoading ? (
                    <SkeletonLine className="h-7 w-4/5" />
                  ) : (
                    <div className="tc-playfair line-clamp-2 text-xl font-bold leading-snug text-foreground">
                      {eventDetail?.eventName ?? "—"}
                    </div>
                  )}

                  {/* Date, venue */}
                  <div className="space-y-2">
                    {isEventLoading ? (
                      <>
                        <SkeletonLine className="h-4 w-3/4" />
                        <SkeletonLine className="h-4 w-2/3" />
                      </>
                    ) : (
                      <>
                        {eventDt && (
                          <InfoRow icon={Calendar}>
                            {dateStr} · {timeStr}
                          </InfoRow>
                        )}
                        {venueStr && (
                          <InfoRow icon={MapPin}>{venueStr}</InfoRow>
                        )}
                        {addressStr && !venueStr && (
                          <InfoRow icon={MapPin}>{addressStr}</InfoRow>
                        )}
                      </>
                    )}
                  </div>

                  <div className="border-t border-border" />

                  {/* Booking metadata */}
                  <div className="space-y-2">
                    {reservationId && (
                      <InfoRow icon={Hash}>
                        Booking ref #{reservationId}
                      </InfoRow>
                    )}
                    {bookedStr && (
                      <InfoRow icon={Clock}>Booked on {bookedStr}</InfoRow>
                    )}
                    {recipient?.fullName && (
                      <InfoRow icon={User}>{recipient.fullName}</InfoRow>
                    )}
                    {recipient?.email && (
                      <InfoRow icon={Mail}>{recipient.email}</InfoRow>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Tickets + payment summary */}
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex-1 p-5">
                  <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    Tickets
                  </div>

                  {isReservationLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex justify-between gap-4">
                          <div className="space-y-1.5">
                            <SkeletonLine className="h-4 w-32" />
                            <SkeletonLine className="h-3 w-16" />
                          </div>
                          <SkeletonLine className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : lineItems.length > 0 ? (
                    <div className="space-y-4">
                      {lineItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between gap-4"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex gap-3 items-center justify-center text-sm font-medium text-foreground">
                              {item.name} {""}
                              <span className="text-xs text-gray-500">
                                ×{item.quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {item.seatLabel && (
                                <>
                                  <Ticket className="size-3 shrink-0" />
                                  <span>Seat {item.seatLabel}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 tabular-nums text-sm font-semibold text-foreground">
                            {fmt(item.unitPrice * item.quantity)}&thinsp;{" "}
                            {data!.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Payment summary */}
                <div className="space-y-2 border-t border-border bg-muted/30 px-5 py-4">
                  {hasDiscount && subtotal !== undefined && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">
                          {fmt(subtotal)}&thinsp;₫
                        </span>
                      </div>
                      {voucher && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Tag className="size-3.5 text-success" />
                            {voucher.code}
                          </span>
                          <span className="tabular-nums text-success">
                            −{fmt(voucher.discountAmount)}&thinsp;₫
                          </span>
                        </div>
                      )}
                      <div className="border-t border-border" />
                    </>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Total
                    </span>
                    <span className="tabular-nums text-lg font-bold text-foreground">
                      {fmt(data!.totalAmount)}&thinsp;
                      <span className="text-xs font-normal text-muted-foreground">
                        {data!.currency}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── ACTION BUTTONS ─────────────────────────────────────────────── */}
            <div className="tc-s3 flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  handleExitFlow();
                  router.replace("/events");
                }}
              >
                Browse events
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  handleExitFlow();
                  router.replace(`/ticket-and-voucher?r=${reservationId}`);
                }}
              >
                View tickets &amp; vouchers
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <Shell>
        <SimpleCard>
          <div className="mb-5 inline-flex text-info">
            <svg
              className="tc-spin"
              width="44"
              height="44"
              viewBox="0 0 44 44"
              fill="none"
            >
              <circle
                cx="22"
                cy="22"
                r="20"
                stroke="currentColor"
                strokeWidth="2"
                opacity=".2"
              />
              <path
                d="M22 2a20 20 0 0 1 20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-info">
            Processing
          </div>
          <div className="text-xl font-bold text-foreground">
            Waiting for payment
          </div>
          <p className="mt-2 line-clamp-none text-sm leading-relaxed text-muted-foreground">
            Complete payment in the checkout window. This page will update
            automatically after you return.
          </p>
          <Button
            variant="ghost"
            className="mt-7 w-full text-muted-foreground"
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            {backLabel}
          </Button>
        </SimpleCard>
      </Shell>
    );
  }

  // ── FAILED / EXPIRED / CANCELLED ────────────────────────────────────────────
  const isExpired = state === "expired";
  const isCancelled = state === "cancelled";
  const statusLabel = isExpired
    ? "Expired"
    : isCancelled
      ? "Cancelled"
      : "Failed";
  const title = isExpired
    ? "Reservation expired"
    : isCancelled
      ? "Reservation cancelled"
      : "Payment failed";
  const description = isExpired
    ? "Your booking time ran out before payment was completed."
    : isCancelled
      ? "This reservation was cancelled."
      : "The payment was not completed. You can start a new booking if you'd like to try again.";

  return (
    <Shell>
      <SimpleCard>
        <div className="mb-5 inline-flex text-destructive">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle
              cx="26"
              cy="26"
              r="24"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity=".4"
            />
            <path
              className="tc-xa"
              d="M18 18L34 34"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              className="tc-xb"
              d="M34 18L18 34"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-destructive">
          {statusLabel}
        </div>
        <div className="text-xl font-bold text-foreground">{title}</div>
        <p className="mt-2 line-clamp-none text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Button
          className="mt-7 w-full"
          onClick={() => {
            handleExitFlow();
            router.replace(eventRoute);
          }}
        >
          {backLabel}
        </Button>
      </SimpleCard>
    </Shell>
  );
}
