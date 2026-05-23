"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { AvailableVoucher } from "@/schemas/reservation";
import {
  formatVoucherDiscount,
  formatVoucherMinOrder,
  formatVoucherWindowShort,
  getVoucherStatus,
} from "./voucher-helpers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voucher: AvailableVoucher | null;
};

const STATUS_LABELS = {
  active: { text: "Active", variant: "success" as const },
  upcoming: { text: "Upcoming", variant: "warning" as const },
  expired: { text: "Expired", variant: "secondary" as const },
};

export function VoucherDetailDialog({ open, onOpenChange, voucher }: Props) {
  if (!voucher) {
    return null;
  }

  const status = getVoucherStatus(voucher);
  const statusDisplay = STATUS_LABELS[status];
  const validWindow = formatVoucherWindowShort(voucher);
  const ticketTypeScope = voucher.ticketTypeIds.length
    ? `${voucher.ticketTypeIds.length} specific ticket type(s)`
    : "All ticket types";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle className="font-mono text-xl">
              {voucher.code}
            </DialogTitle>
            <Badge variant={statusDisplay.variant}>{statusDisplay.text}</Badge>
          </div>
          <DialogDescription>
            {voucher.description ||
              "No description available for this voucher."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-right font-medium">
              {formatVoucherDiscount(voucher)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Minimum order</span>
            <span className="text-right font-medium">
              {formatVoucherMinOrder(voucher)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Valid Window</span>
            <span className="text-right font-medium">{validWindow}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Applies to</span>
            <span className="text-right font-medium">{ticketTypeScope}</span>
          </div>
        </div>

        {voucher.ticketTypeIds.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ticket type IDs
              </p>
              <div className="flex flex-wrap gap-2">
                {voucher.ticketTypeIds.map((ticketTypeId) => (
                  <Badge
                    key={ticketTypeId}
                    variant="outline"
                    className="font-mono"
                  >
                    {ticketTypeId}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
