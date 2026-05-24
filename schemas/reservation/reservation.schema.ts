import { z } from "zod";
import {
  BigIntIdSchema,
  BaseResponseSchema,
  PagedResponseSchema,
} from "../api";
import { VoucherDiscountTypeSchema } from "../payment";

// BE sends string status names
export const RESERVATION_STATUS = {
  PENDING: "PENDING",
  EXPIRED: "EXPIRED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  PAYMENT_LOCKED: "PAYMENT_LOCKED",
} as const;

export type ReservationStatus =
  (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];

const AmountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val));

export const ReservationItemSchema = z.object({
  id: BigIntIdSchema,
  ticketTypeId: BigIntIdSchema,
  ticketTypeName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: AmountSchema,
  seatIndex: z.number().int().nonnegative().nullable().optional(),
  seatLabel: z.string().nullable().optional(),
  row: z.string().nullable().optional(),
  column: z.string().nullable().optional(),
});

const ReservationRecipientSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phoneCountryCode: z.string(),
  phoneNumber: z.string(),
  idPassport: z.string().nullable().optional(),
});

export const ReservationEventSchema = z.object({
  eventName: z.string(),
  eventDate: z.iso.datetime(),
  featuredImageUrl: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
});

export type ReservationEvent = z.infer<typeof ReservationEventSchema>;

export const ReservationSchema = z.object({
  id: BigIntIdSchema,
  // Transitional compatibility: some legacy reservation responses can omit these
  // fields even though the public contract is moving to eventCode/eventSlug.
  eventCode: z.string().optional(),
  eventSlug: z.string().optional(),
  userId: BigIntIdSchema.optional(),
  status: z.enum(["PENDING", "EXPIRED", "PAID", "CANCELLED", "PAYMENT_LOCKED"]),
  totalAmount: AmountSchema,
  subtotalAmount: AmountSchema.optional(),
  voucher: z
    .object({
      code: z.string(),
      type: VoucherDiscountTypeSchema.nullable().optional(),
      discountAmount: AmountSchema,
    })
    .nullable()
    .optional(),
  currency: z.string().optional(),
  items: z.array(ReservationItemSchema).optional(),
  expiresAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime().optional(),
  recipient: ReservationRecipientSchema.nullable().optional(),
  deliveryMethod: z.string().nullable().optional(),
  event: ReservationEventSchema.optional(),
});

export type Reservation = z.infer<typeof ReservationSchema>;
export type ReservationItem = z.infer<typeof ReservationItemSchema>;

export const ReservationResultSchema = BaseResponseSchema(ReservationSchema);
export type ReservationResult = z.infer<typeof ReservationResultSchema>;

export const UpdateReservationRecipientSchema = z.object({
  id: BigIntIdSchema,
  status: z.enum(["PENDING", "EXPIRED", "PAID", "CANCELLED", "PAYMENT_LOCKED"]),
  totalAmount: AmountSchema,
  subtotalAmount: AmountSchema.optional(),
  voucher: z
    .object({
      code: z.string(),
      type: VoucherDiscountTypeSchema.nullable().optional(),
      discountAmount: AmountSchema,
    })
    .nullable()
    .optional(),
  currency: z.string().optional(),
  expiresAt: z.iso.datetime().optional(),
  recipient: ReservationRecipientSchema.nullable().optional(),
  deliveryMethod: z.string().nullable().optional(),
});

export const UpdateReservationRecipientResultSchema = BaseResponseSchema(
  UpdateReservationRecipientSchema,
);
export type UpdateReservationRecipientResult = z.infer<
  typeof UpdateReservationRecipientResultSchema
>;

export const ReservationListResultSchema =
  PagedResponseSchema(ReservationSchema);
export type ReservationListResult = z.infer<typeof ReservationListResultSchema>;

// Shape returned by POST /reservations/ga and POST /reservations/seated
export const CreateReservationResponseSchema = z.object({
  status: z.boolean(),
  reservationId: BigIntIdSchema,
});
export type CreateReservationResponse = z.infer<
  typeof CreateReservationResponseSchema
>;

export const ApplyReservationVoucherSchema = z.object({
  reservationId: BigIntIdSchema,
  totalAmount: AmountSchema,
  subtotalAmount: AmountSchema,
  discountAmount: AmountSchema,
  voucher: z
    .object({
      code: z.string(),
      type: VoucherDiscountTypeSchema,
    })
    .nullable(),
});

export const ApplyReservationVoucherResultSchema = BaseResponseSchema(
  ApplyReservationVoucherSchema,
);
export type ApplyReservationVoucherResult = z.infer<
  typeof ApplyReservationVoucherResultSchema
>;

export const AvailableVoucherSchema = z.object({
  code: z.string(),
  description: z.string().nullable(),
  discountType: VoucherDiscountTypeSchema,
  discountValue: AmountSchema,
  maxDiscountAmount: AmountSchema,
  minOrderAmount: AmountSchema,
  startsAt: z.iso.datetime().nullable(),
  endsAt: z.iso.datetime().nullable(),
  ticketTypeIds: z.array(BigIntIdSchema),
});

export type AvailableVoucher = z.infer<typeof AvailableVoucherSchema>;

export const AvailableVoucherListResultSchema = PagedResponseSchema(
  AvailableVoucherSchema,
);

export type AvailableVoucherListResult = z.infer<
  typeof AvailableVoucherListResultSchema
>;
