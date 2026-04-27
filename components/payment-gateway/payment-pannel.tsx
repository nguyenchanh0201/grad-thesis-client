"use client";

import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmt } from "@/lib/strings/money";
import { formatDeadline } from "@/lib/payment-gateway/formatInvoice";

type Props = {
  deadline: Date;
  totalAmount: number;
  isPaying: boolean;
  onPay: () => void;
};

export function PaymentPanel({
  deadline,
  totalAmount,
  isPaying,
  onPay,
}: Props) {
  return (
    <div className="flex flex-col gap-8 p-6 md:p-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Pay before {formatDeadline(deadline).toUpperCase()}
        </p>
        <p className="mt-2 text-4xl font-bold tabular-nums text-primary">
          VND {fmt(totalAmount)}
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Payment Method
        </p>
        <div className="flex items-center gap-4 rounded-sm border border-primary bg-primary/5 p-4">
          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-[#003087] text-xs font-extrabold tracking-wider text-white">
            VNPAY
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">VNPay</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              QR Code · Internet Banking · ATM Card · E-wallet
            </p>
          </div>
          <QrCode className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={onPay}
        disabled={isPaying || totalAmount === 0}
      >
        {isPaying ? "Redirecting to VNPay..." : "Pay Now"}
      </Button>
    </div>
  );
}
