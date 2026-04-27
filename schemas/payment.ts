export type PaymentMethodId = "vnpay" | "bank_transfer" | "international_card";

export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  description: string;
  iconKey: string;
  enabled: boolean;
};

export type DiscountCode = {
  code: string;
  discountAmount: number;
  type: "fixed" | "percent";
  valid: boolean;
  errorMessage?: string;
};
