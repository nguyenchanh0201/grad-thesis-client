"use client";

import { CheckCircle2, Copy, Loader2, QrCode, XCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDeadline } from "@/lib/payment-gateway/formatInvoice";
import { fmt } from "@/lib/strings/money";
import type {
  ManualTransferDetails,
  PaymentMethodPresentation,
} from "./payment-method-config";

type Props = {
  deadline: Date;
  totalAmount: number;
  presentation: PaymentMethodPresentation;
  isHostedGateway?: boolean;
  transferDetails: ManualTransferDetails;
  transferQrValue: string;
  paymentState: "ready" | "loading" | "success" | "failed";
  isPreparingGateway?: boolean;
  gatewayError?: string | null;
};

export function PaymentPanel({
  deadline,
  totalAmount,
  presentation,
  isHostedGateway = false,
  transferDetails,
  transferQrValue,
  paymentState,
  isPreparingGateway = false,
  gatewayError = null,
}: Props) {
  const qrState = isPreparingGateway ? "loading" : paymentState;
  const fields = [
    { label: "Provider", value: presentation.label },
    { label: "Recipient", value: transferDetails.recipientName },
    { label: "Bank", value: transferDetails.bankName },
    { label: "Account number", value: transferDetails.accountNumber },
    { label: "Account name", value: transferDetails.accountName },
    {
      label: "Wallet",
      value: transferDetails.walletName ?? "",
    },
    {
      label: "Apps",
      value: transferDetails.supportedApps.join(", "),
    },
    { label: "Amount", value: `VND ${fmt(totalAmount)}` },
    { label: "Transfer reference", value: transferDetails.transferContent },
  ].filter((field) => field.value.trim().length > 0);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

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
          <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded bg-[#003087] px-2 text-center text-xs font-extrabold tracking-wider text-white">
            {presentation.label.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {presentation.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {presentation.subtitle}
            </p>
          </div>
          <QrCode className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-lg border border-border bg-white p-3">
            {qrState === "loading" ? (
              <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-muted-foreground">
                <Loader2 className="h-9 w-9 animate-spin" />
              </div>
            ) : qrState === "success" ? (
              <div className="flex h-[180px] w-[180px] items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-16 w-16" />
              </div>
            ) : qrState === "failed" ? (
              <div className="flex h-[180px] w-[180px] items-center justify-center text-destructive">
                <XCircle className="h-16 w-16" />
              </div>
            ) : isHostedGateway && gatewayError ? (
              <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-muted-foreground">
                QR unavailable
              </div>
            ) : transferQrValue.trim().length > 0 ? (
              <QRCodeCanvas value={transferQrValue} size={180} level="H" />
            ) : (
              <div className="flex h-[180px] w-[180px] items-center justify-center text-xs text-muted-foreground">
                QR unavailable
              </div>
            )}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {qrState === "success"
              ? "Payment confirmed."
              : qrState === "failed"
                ? "Payment failed or the reservation expired."
                : qrState === "loading"
                  ? "Preparing payment details..."
                  : "Use your banking app or wallet to complete payment."}
          </p>
          {gatewayError ? (
            <p className="text-center text-xs text-destructive">
              {gatewayError}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2"
            >
              <div>
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="text-sm font-medium text-foreground">
                  {field.value}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => handleCopy(field.value, field.label)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {transferDetails.note ? (
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {transferDetails.note}
        </div>
      ) : null}

      {qrState === "ready" || qrState === "loading" ? (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          We will automatically update this page when the payment provider
          confirms success or failure.
        </div>
      ) : null}
    </div>
  );
}
