"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isAppError } from "@/core/error";
import {
  applyReservationVoucher,
  removeReservationVoucher,
} from "@/services/reservation.service";
import { useBookingStore } from "@/lib/store/booking";
import { reservationKeys } from "@/hooks/use-booking";
import { toast } from "sonner";
import type { AvailableVoucher } from "@/schemas/reservation";
import { VOUCHER_DISCOUNT_TYPE } from "@/schemas/payment";
import { cn } from "@/lib/utils";

type Props = {
  reservationId?: string | null;
  vouchers?: AvailableVoucher[];
  appliedVoucher?: {
    code: string;
    discountAmount: number;
    type?: string | null;
  } | null;
};

export function DiscountCodeInput({
  reservationId,
  vouchers = [],
  appliedVoucher = null,
}: Props) {
  const queryClient = useQueryClient();
  const { discountCode, setDiscountCode } = useBookingStore();
  const [input, setInput] = useState(discountCode?.code ?? "");
  const [loading, setLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const formatVoucherSummary = (voucher: AvailableVoucher) => {
    if (voucher.discountType === VOUCHER_DISCOUNT_TYPE.PERCENT) {
      return `${voucher.discountValue}% off`;
    }
    return `${voucher.discountValue.toLocaleString("vi-VN")} VND off`;
  };

  const handleApply = async () => {
    if (!input.trim() || !reservationId) return;
    setLoading(true);
    try {
      const result = await applyReservationVoucher(reservationId, input);
      const voucher = result.data.voucher;
      if (voucher) {
        setDiscountCode({
          code: voucher.code,
          valid: true,
          type: voucher.type,
          discountAmount: result.data.discountAmount,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: reservationKeys.detail(reservationId),
      });
    } catch (error) {
      setDiscountCode({
        code: input.trim().toUpperCase(),
        valid: false,
        type: VOUCHER_DISCOUNT_TYPE.FIXED,
        discountAmount: 0,
        errorMessage: isAppError(error)
          ? error.message
          : "Could not apply voucher code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFromList = async (code: string) => {
    if (!reservationId) return;
    setInput(code);
    setLoading(true);
    try {
      const result = await applyReservationVoucher(reservationId, code);
      const voucher = result.data.voucher;
      if (voucher) {
        setDiscountCode({
          code: voucher.code,
          valid: true,
          type: voucher.type,
          discountAmount: result.data.discountAmount,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: reservationKeys.detail(reservationId),
      });
    } catch (error) {
      toast.error(
        isAppError(error) ? error.message : "Could not apply voucher",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!reservationId || !discountCode?.valid) return;
    setLoading(true);
    try {
      await removeReservationVoucher(reservationId);
      setDiscountCode(null);
      await queryClient.invalidateQueries({
        queryKey: reservationKeys.detail(reservationId),
      });
      toast.success("Voucher removed");
    } catch (error) {
      toast.error(
        isAppError(error) ? error.message : "Could not remove voucher code",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (discountCode) setDiscountCode(null);
  };

  const normalizedQuery = input.trim().toLowerCase();
  const filteredVouchers = vouchers.filter((voucher) => {
    if (!normalizedQuery) return true;
    return (
      voucher.code.toLowerCase().includes(normalizedQuery) ||
      (voucher.description ?? "").toLowerCase().includes(normalizedQuery)
    );
  });
  const showVoucherList =
    isInputFocused && vouchers.length > 0 && !loading && !appliedVoucher;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative space-y-2">
        <div className="flex items-stretch gap-2">
          <Input
            value={input}
            onChange={handleChange}
            placeholder="Enter discount code"
            className="min-h-11 w-full border-0 bg-gray-50 text-sm"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              window.setTimeout(() => setIsInputFocused(false), 120);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
          <Button
            variant="default"
            className="min-h-11 shrink-0 px-4 sm:px-6"
            onClick={handleApply}
            disabled={loading || !input.trim() || !reservationId}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
          </Button>
        </div>
        {showVoucherList ? (
          <div className="absolute z-30 mt-1 w-full overflow-y-auto rounded-md py-1 shadow-md ring-1 ring-border">
            {filteredVouchers.length > 0 ? (
              filteredVouchers.map((voucher) => (
                <button
                  key={voucher.code}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleApplyFromList(voucher.code)}
                >
                  <span className="font-medium">{voucher.code}</span>
                  <span className="text-right text-xs text-muted-foreground">
                    {formatVoucherSummary(voucher)}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No voucher found.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {discountCode && !discountCode.valid && (
        <p className="line-clamp-none text-xs text-destructive">
          {discountCode.errorMessage}
        </p>
      )}

      <Card
        size="sm"
        className={cn("gap-2 bg-muted/30", !appliedVoucher && "hidden")}
      >
        <CardHeader>
          <CardTitle className="text-sm">Applied vouchers</CardTitle>
        </CardHeader>
        <CardContent>
          {appliedVoucher ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{appliedVoucher.code}</Badge>
                <span className="text-muted-foreground">
                  -{appliedVoucher.discountAmount.toLocaleString("vi-VN")} VND
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleRemove}
                disabled={loading || !reservationId}
              >
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No voucher applied.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
