"use client";

import { Calendar, CircleDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AvailableVoucher } from "@/schemas/reservation";
import {
  formatVoucherDiscount,
  formatVoucherMinOrder,
  formatVoucherValidUntil,
} from "./voucher-helpers";

type Props = {
  voucher: AvailableVoucher;
  onOpenDetails: (voucher: AvailableVoucher) => void;
};

export function VoucherCard({ voucher, onOpenDetails }: Props) {
  return (
    <button
      type="button"
      onClick={() => onOpenDetails(voucher)}
      className="w-full cursor-pointer text-left"
      aria-label={`Open voucher ${voucher.code}`}
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-lg">{voucher.code}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 pb-4">
          <div className="flex items-center gap-2 text-sm text-foreground sm:text-base">
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{formatVoucherDiscount(voucher)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Valid until {formatVoucherValidUntil(voucher)}</span>
          </div>

          {voucher.minOrderAmount > 0 && (
            <p className="text-sm text-muted-foreground">
              Min order: {formatVoucherMinOrder(voucher)}
            </p>
          )}
        </CardContent>
      </Card>
    </button>
  );
}
