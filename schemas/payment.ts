import { z } from "zod";
import { BaseResponseSchema } from "./api";

export const PaymentMethodIdSchema = z.enum([
  "vnpay",
  "bank_transfer",
  "international_card",
  "momo",
]);
export type PaymentMethodId = z.infer<typeof PaymentMethodIdSchema>;

export const PaymentMethodSchema = z.object({
  id: PaymentMethodIdSchema,
  providerCode: z.string(),
  label: z.string(),
  description: z.string().optional(),
  iconKey: z.string().default("credit-card"),
  enabled: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export type PaymentMethod = {
  id: PaymentMethodId;
  providerCode: string;
  label: string;
  description?: string;
  iconKey: string;
  enabled: boolean;
  sortOrder: number;
};

export const PaymentMethodsDataSchema = z.array(PaymentMethodSchema);
export const PaymentMethodsResponseSchema = BaseResponseSchema(
  PaymentMethodsDataSchema,
);
export type PaymentMethodsResponse = z.infer<
  typeof PaymentMethodsResponseSchema
>;

export type DiscountCode = {
  code: string;
  discountAmount: number;
  type: "fixed" | "percent";
  valid: boolean;
  errorMessage?: string;
};
