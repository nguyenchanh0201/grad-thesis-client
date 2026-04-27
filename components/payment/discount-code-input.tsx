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
      <h3 className="text-sm font-semibold text-foreground">Discount code</h3>
      <div className="flex">
        <Input
          value={input}
          onChange={handleChange}
          placeholder="Enter discount code"
          className="flex-1 rounded-none py-5"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
        <Button
          variant="default"
          className="h-auto rounded-none"
          onClick={handleApply}
          disabled={loading || !input.trim()}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
        </Button>
      </div>

      {discountCode && discountCode.valid && (
        <p className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="size-3.5" />
          Code applied — saving{" "}
          {discountCode.discountAmount.toLocaleString("vi-VN")} VND
        </p>
      )}
      {discountCode && !discountCode.valid && (
        <p className="text-xs text-destructive">{discountCode.errorMessage}</p>
      )}
    </div>
  );
}
