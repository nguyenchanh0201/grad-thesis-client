import type { DiscountCode } from "@/schemas/payment";

const MOCK_CODES: Record<
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
  const mock = MOCK_CODES[upper];

  if (!mock) {
    return {
      code,
      valid: false,
      type: "fixed",
      discountAmount: 0,
      errorMessage: "Invalid discount code",
    };
  }

  const discountAmount =
    mock.type === "percent"
      ? Math.round((subtotal * mock.discountAmount) / 100)
      : mock.discountAmount;

  return { code: upper, valid: true, type: mock.type, discountAmount };
}
