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
import { useBuyProcess } from "@/components/buy-process/buy-process-shell";

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
  const { syncToExpiry, formatted, hasSyncedExpiry } = useBuyProcess();

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

  useEffect(() => {
    const expiresAt = data?.effectiveExpiresAt ?? data?.expiresAt;
    if (!expiresAt) return;
    syncToExpiry(expiresAt);
  }, [data?.effectiveExpiresAt, data?.expiresAt, syncToExpiry]);

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

  const paymentRoute = resolvedSlug ? `/buy/${resolvedSlug}/payment` : "/events";
  const eventRoute = resolvedSlug ? `/events/${resolvedSlug}` : "/events";

  if (isInvalidChecksum) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Payment verification failed
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not verify VNPay callback integrity. Please start checkout
            again from a trusted session.
          </p>
          <Button
            className="mt-5"
            onClick={() => router.replace(paymentRoute)}
          >
            Back to payment
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
            onClick={() => router.replace(paymentRoute)}
          >
            Back to payment
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
          {hasSyncedExpiry ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Time left: {formatted}
            </p>
          ) : null}
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
            Could not load payment status from backend.
          </p>
          <Button
            className="mt-5"
            onClick={() => router.replace(paymentRoute)}
          >
            Back to payment
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

  const isExpired = state === "expired";
  const isCancelled = state === "cancelled";
  const title = isExpired
    ? "Payment expired"
    : isCancelled
      ? "Payment cancelled"
      : state === "failed"
        ? "Payment failed"
        : "Payment pending";

  const description = isExpired
    ? "Your reservation has expired. Please start again."
    : isCancelled
      ? "This reservation was cancelled. You can create a new payment session."
      : state === "failed"
        ? "VNPay did not complete this payment."
        : "Payment is still pending provider confirmation.";

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-sm border border-border bg-background p-6 text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {hasSyncedExpiry && state === "pending" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Time left: {formatted}
          </p>
        ) : null}
        <div className="mt-5 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.replace(paymentRoute)}
          >
            Back to payment
          </Button>
          <Button
            onClick={() => {
              handleExitFlow();
              router.replace(eventRoute);
            }}
          >
            Exit flow
          </Button>
        </div>
      </div>
    </div>
  );
}
