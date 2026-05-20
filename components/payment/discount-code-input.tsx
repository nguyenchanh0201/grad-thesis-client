"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Props = {
  reservationId?: string | null;
  vouchers?: AvailableVoucher[];
};

export function DiscountCodeInput({ reservationId, vouchers = [] }: Props) {
  const queryClient = useQueryClient();
  const { discountCode, setDiscountCode } = useBookingStore();
  const [input, setInput] = useState(discountCode?.code ?? "");
  const [loading, setLoading] = useState(false);
  const selectedVoucherCode = vouchers.some((voucher) => voucher.code === input)
    ? input
    : undefined;

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

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Promotion
        </p>
        <h3 className="line-clamp-none text-base font-medium text-foreground">
          Add a discount code
        </h3>
        <p className="line-clamp-none text-sm leading-6 text-muted-foreground">
          Applied discounts are reflected in the order total before payment.
        </p>
      </div>

      {vouchers.length > 0 ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">My vouchers</p>
          <Select
            value={selectedVoucherCode}
            onValueChange={(value) => {
              setInput(value);
              if (discountCode) setDiscountCode(null);
            }}
            disabled={loading}
          >
            <SelectTrigger className="min-h-11 w-full border-0 bg-gray-50 px-3 text-sm">
              <SelectValue placeholder="Select a voucher" />
            </SelectTrigger>
            <SelectContent
              align="start"
              className="w-[var(--radix-select-trigger-width)]"
            >
              {vouchers.map((voucher) => (
                <SelectItem key={voucher.code} value={voucher.code}>
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{voucher.code}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatVoucherSummary(voucher)}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={input}
          onChange={handleChange}
          placeholder="Enter discount code"
          className="min-h-11 flex-1 border-0 bg-gray-50"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
        <Button
          variant="default"
          className="min-h-11 sm:px-6"
          onClick={handleApply}
          disabled={loading || !input.trim() || !reservationId}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </Button>
        {discountCode?.valid ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 sm:px-6"
            onClick={handleRemove}
            disabled={loading || !reservationId}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {discountCode && discountCode.valid && (
        <p className="line-clamp-none flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5" />
          Code applied - saving{" "}
          {discountCode.discountAmount.toLocaleString("vi-VN")} VND
        </p>
      )}
      {discountCode && !discountCode.valid && (
        <p className="line-clamp-none text-xs text-destructive">
          {discountCode.errorMessage}
        </p>
      )}
    </div>
  );
}
