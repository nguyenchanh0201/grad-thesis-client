import { z } from "zod";
import {
  BigIntIdSchema,
  BaseResponseSchema,
  PagedResponseSchema,
} from "../api";
import { TicketTypeSchema } from "../ticket-type";

export enum ReservationStatus {
  PENDING = 0,
  EXPIRED = 1,
  PAID = 2,
  CANCELLED = 3,
  PAYMENT_LOCKED = 4,
}

const CentsSchema = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val));

export const ReservationItemSchema = z.object({
  id: BigIntIdSchema,
  ticketType: TicketTypeSchema,
  quantity: z.number().int().positive(),
  unitPrice: CentsSchema,
  seatIndex: z.number().int().nonnegative().optional(),
  row: z.string().optional(),
  column: z.string().optional(),
});

export const ReservationSchema = z.object({
  id: BigIntIdSchema,
  eventId: BigIntIdSchema,
  userId: BigIntIdSchema,
  status: z.nativeEnum(ReservationStatus),
  totalAmount: CentsSchema,
  currency: z.string().optional(),
  items: z.array(ReservationItemSchema).optional(),
  expiresAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime().optional(),
});

export type Reservation = z.infer<typeof ReservationSchema>;
export type ReservationItem = z.infer<typeof ReservationItemSchema>;

export const ReservationResultSchema = BaseResponseSchema(ReservationSchema);
export type ReservationResult = z.infer<typeof ReservationResultSchema>;

export const ReservationListResultSchema =
  PagedResponseSchema(ReservationSchema);
export type ReservationListResult = z.infer<typeof ReservationListResultSchema>;
