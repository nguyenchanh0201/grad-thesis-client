import { z } from "zod";
import { BaseResponseSchema } from "./api";

export const PaymentMethodIdSchema = z.enum([
  "vnpay",
  "mock",
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
  checkoutConfig: z
    .object({
      type: z.enum(["hosted_gateway", "manual_transfer", "wallet"]),
      recipientName: z.string().optional(),
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      accountName: z.string().optional(),
      walletName: z.string().optional(),
      supportedApps: z.array(z.string()).optional(),
      transferContentTemplate: z.string().optional(),
      qrPayload: z.string().optional(),
      note: z.string().optional(),
    })
    .optional(),
});

export type PaymentMethod = {
  id: PaymentMethodId;
  providerCode: string;
  label: string;
  description?: string;
  iconKey: string;
  enabled: boolean;
  sortOrder: number;
  checkoutConfig?: {
    type: "hosted_gateway" | "manual_transfer" | "wallet";
    recipientName?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    walletName?: string;
    supportedApps?: string[];
    transferContentTemplate?: string;
    qrPayload?: string;
    note?: string;
  };
};

export const PaymentMethodsDataSchema = z.array(PaymentMethodSchema);
export const PaymentMethodsResponseSchema = BaseResponseSchema(
  PaymentMethodsDataSchema,
);
export type PaymentMethodsResponse = z.infer<
  typeof PaymentMethodsResponseSchema
>;

export const PaymentTransferDetailsSchema = z.object({
  recipientName: z.string(),
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  walletName: z.string().optional(),
  supportedApps: z.array(z.string()).default([]),
  transferContent: z.string(),
  note: z.string().optional(),
});

export const PreparePaymentDataSchema = z.object({
  transactionId: z.string(),
  externalRefId: z.string(),
  methodId: PaymentMethodIdSchema,
  providerCode: z.string(),
  checkoutType: z.enum(["hosted_gateway", "manual_transfer", "wallet"]),
  amount: z.number(),
  currency: z.literal("VND"),
  expiresAt: z.iso.datetime(),
  qrPayload: z.string(),
  paymentUrl: z.string().nullable().optional(),
  transfer: PaymentTransferDetailsSchema.optional(),
});

export const PreparePaymentResponseSchema = BaseResponseSchema(
  PreparePaymentDataSchema,
);
export type PreparePaymentData = z.infer<typeof PreparePaymentDataSchema>;

export const PaymentConfirmationSchema = z.object({
  reservationId: z.string(),
  // Compatibility: some backend nodes may still omit these fields.
  eventCode: z.string().optional(),
  eventSlug: z.string().optional(),
  reservationStatus: z.enum([
    "PENDING",
    "PAYMENT_LOCKED",
    "PAID",
    "CANCELLED",
    "EXPIRED",
  ]),
  totalAmount: z.number(),
  currency: z.literal("VND"),
  expiresAt: z.iso.datetime(),
  effectiveExpiresAt: z.iso.datetime().optional(),
  payment: z
    .object({
      id: z.string(),
      externalRefId: z.string(),
      status: z.enum(["INITIATED", "SUCCESS", "FAILED", "REFUNDED", "VOIDED"]),
      providerCode: z.string(),
      methodId: PaymentMethodIdSchema.nullable(),
      paymentUrl: z.string().nullable(),
      initiatedAt: z.iso.datetime(),
      completedAt: z.iso.datetime().nullable(),
    })
    .nullable(),
  activeMethod: PaymentMethodSchema.nullable(),
});

export const PaymentConfirmationResponseSchema = BaseResponseSchema(
  PaymentConfirmationSchema,
);
export type PaymentConfirmationResponse = z.infer<
  typeof PaymentConfirmationResponseSchema
>;

export const VoucherDiscountTypeSchema = z.enum(["fixed", "percent"]);
export type VoucherDiscountType = z.infer<typeof VoucherDiscountTypeSchema>;

export const VOUCHER_DISCOUNT_TYPE = {
  FIXED: "fixed",
  PERCENT: "percent",
} as const;

export type DiscountCode = {
  code: string;
  discountAmount: number;
  type: VoucherDiscountType;
  valid: boolean;
  errorMessage?: string;
};
