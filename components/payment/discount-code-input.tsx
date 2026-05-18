"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { applyDiscountCode } from "@/lib/payment/applyDiscountCode";
import { useBookingStore } from "@/lib/store/booking";

type Props = {
  subtotal: number;
};

export function DiscountCodeInput({ subtotal }: Props) {
  const { discountCode, setDiscountCode } = useBookingStore();
  const [input, setInput] = useState(discountCode?.code ?? "");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!input.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = applyDiscountCode(input, subtotal);
    setDiscountCode(result);
    setLoading(false);
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
          disabled={loading || !input.trim()}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </Button>
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
