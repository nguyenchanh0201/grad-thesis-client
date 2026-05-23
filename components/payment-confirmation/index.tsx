"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { isAppError } from "@/core/error";
import { clearBuySession } from "@/lib/booking/buy-session";
import { useBookingStore } from "@/lib/store/booking";
import { getPaymentConfirmationStatus } from "@/services/payment.service";
import { RESERVATION_STATUS } from "@/schemas/reservation/reservation.schema";
import { Button } from "@/components/ui/button";

type Props = {
  slug?: string;
};

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
  const slugFromQuery = searchParams.get("slug");
  const resolvedSlug = slug ?? slugFromQuery ?? null;
  const {
    reservationId: storeReservationId,
    setReservationId,
    reset,
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

  const { data, error, isLoading } = useQuery({
    queryKey: ["payment-confirmation", reservationId],
    queryFn: () => getPaymentConfirmationStatus(reservationId!),
    enabled: !!reservationId,
    retry: false,
    refetchInterval: 5000,
  });

  const state = useMemo(() => {
    if (!data) return null;
    if (data.reservationStatus === RESERVATION_STATUS.PAID) return "success";
    if (data.reservationStatus === RESERVATION_STATUS.CANCELLED) {
      return "cancelled";
    }
    if (data.reservationStatus === RESERVATION_STATUS.EXPIRED) return "expired";
    if (data.payment?.status === "FAILED") return "failed";
    return "pending";
  }, [data]);

  const handleExitFlow = () => {
    if (resolvedSlug) {
      clearBuySession(resolvedSlug);
    }
    reset();
  };

  const eventRoute = resolvedSlug ? `/events/${resolvedSlug}` : "/events";
  const backLabel = resolvedSlug ? "Back to event" : "Browse events";

  if (isInvalidChecksum) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Payment verification failed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not verify the payment callback. Please check your orders
            before trying again.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            {backLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (!reservationId) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Confirmation unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Missing reservation information for payment confirmation.
          </p>
          <Button
            className="mt-5"
            onClick={() => router.replace(eventRoute)}
          >
            {backLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || (!data && !error)) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Confirming payment...
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We are checking VNPay result with backend status.
          </p>
        </div>
      </div>
    );
  }

  if (error && isAppError(error) && error.status === 401) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Session expired
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in again to check your payment status.
          </p>
          <Button
            className="mt-5"
            onClick={() =>
              router.replace(
                `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
              )
            }
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Confirmation unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Could not load payment status. Please check your orders or contact
            support if money was deducted.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            {backLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Payment successful
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your order is confirmed and tickets are being issued.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                handleExitFlow();
                router.replace("/events");
              }}
            >
              Browse events
            </Button>
            <Button
              onClick={() => {
                handleExitFlow();
                router.replace("/ticket-and-voucher");
              }}
            >
              View tickets & vouchers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h1 className="mt-4 text-xl font-semibold text-foreground">
            Waiting for payment
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete payment in the checkout tab. This page will update
            automatically.
          </p>
          <Button
            variant="ghost"
            className="mt-5 text-muted-foreground"
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            {backLabel}
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = state === "expired";
  const isCancelled = state === "cancelled";
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
    <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <Button
          className="mt-5"
          onClick={() => {
            handleExitFlow();
            router.replace(eventRoute);
          }}
        >
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
