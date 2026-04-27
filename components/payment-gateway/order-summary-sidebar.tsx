import { Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { fmt } from "@/lib/strings/money";
import {
  formatDeadline,
  formatInvoiceId,
} from "@/lib/payment-gateway/formatInvoice";
import type { GatewayLineItem } from "@/schemas/payment-gateway";

type Props = {
  invoiceId: string;
  deadline: Date;
  lineItems: GatewayLineItem[];
  subtotal: number;
  discount: { code: string; amount: number } | null;
  total: number;
};

export function OrderSummarySidebar({
  invoiceId,
  deadline,
  lineItems,
  subtotal,
  discount,
  total,
}: Props) {
  return (
    <div className="flex flex-col gap-5 p-6">
      <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-muted-foreground">Invoice #:</span>
          <span
            className="truncate font-mono text-xs text-foreground"
            title={invoiceId}
          >
            {formatInvoiceId(invoiceId)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            Pay before{" "}
            <span className="font-semibold text-foreground">
              {formatDeadline(deadline)}
            </span>
          </span>
        </div>
      </div>

      <Separator />

      {lineItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tickets selected</p>
      ) : (
        <div className="space-y-4">
          {lineItems.map((item, i) => (
            <div key={i}>
              <div className="flex items-start justify-between text-sm">
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
                <span className="font-medium text-foreground">
                  {fmt(item.total)} VND
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.quantity} × {fmt(item.unitPrice)} VND
              </p>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{fmt(subtotal)} VND</span>
        </div>
        {discount && (
          <div className="flex items-center justify-between text-green-600">
            <span>Discount ({discount.code})</span>
            <span>−{fmt(discount.amount)} VND</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-base font-bold text-foreground">
            Total Amount Due
          </span>
          <span className="text-base font-bold text-primary">
            {fmt(total)} VND
          </span>
        </div>
      </div>
    </div>
  );
}
