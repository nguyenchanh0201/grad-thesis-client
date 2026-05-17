import type { DiscountCode } from "@/schemas/payment";

const LOCAL_DISCOUNT_CODES: Record<
  string,
  Omit<DiscountCode, "code" | "valid" | "errorMessage">
> = {
  DISCOUNT10: { type: "percent", discountAmount: 10 },
  FLAT50K: { type: "fixed", discountAmount: 50_000 },
  VIP100K: { type: "fixed", discountAmount: 100_000 },
};

export function applyDiscountCode(
  code: string,
  subtotal: number,
): DiscountCode {
  const upper = code.trim().toUpperCase();
  const selectedCode = LOCAL_DISCOUNT_CODES[upper];

  if (!selectedCode) {
    return {
      code,
      valid: false,
      type: "fixed",
      discountAmount: 0,
      errorMessage: "Invalid discount code",
    };
  }

  const discountAmount =
    selectedCode.type === "percent"
      ? Math.round((subtotal * selectedCode.discountAmount) / 100)
      : selectedCode.discountAmount;

  return {
    code: upper,
    valid: true,
    type: selectedCode.type,
    discountAmount,
  };
}
