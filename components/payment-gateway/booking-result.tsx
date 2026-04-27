"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/lib/store/booking";
import { clearBuySession } from "@/lib/booking/buy-session";
import { fmt } from "@/lib/strings/money";

type Props = {
  slug: string;
  isSuccess: boolean;
  invoiceId: string;
  amount: number;
  transactionNo?: string;
};

export function BookingResult({
  slug,
  isSuccess,
  invoiceId,
  amount,
  transactionNo,
}: Props) {
  const router = useRouter();
  const { reset } = useBookingStore();

  useEffect(() => {
    if (isSuccess) {
      clearBuySession(slug);
      reset();
    }
  }, [isSuccess, slug, reset]);

  if (isSuccess) {
    return (
      <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 px-4 py-12">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground">
            Your order has been confirmed.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3 rounded-sm border border-border bg-muted/30 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice</span>
            <span className="font-mono text-foreground">{invoiceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Paid</span>
            <span className="font-semibold text-primary">
              {fmt(amount)} VND
            </span>
          </div>
          {transactionNo && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction</span>
              <span className="font-mono text-foreground">{transactionNo}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/")}>
            Browse Events
          </Button>
          <Button onClick={() => router.push("/my-tickets")}>
            View My Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] flex-col items-center justify-center gap-6 px-4 py-12">
      <XCircle className="h-16 w-16 text-destructive" />
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-foreground">Payment Failed</h1>
        <p className="text-muted-foreground">
          Your payment could not be processed. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            clearBuySession(slug);
            reset();
            router.push(`/events/${slug}`);
          }}
        >
          Cancel
        </Button>
        <Button onClick={() => router.push(`/buy/${slug}/confirmation`)}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
