import { z } from "zod";
import { BigIntIdSchema, BaseResponseSchema, PagedResponseSchema } from "./api";
import { VenueSchema } from "./venue";

// ── FE-side display types (used by mock data & UI components) ──────────────

export type TicketStatus = "confirmed" | "pending" | "used" | "cancelled";

export type TicketLineItem = {
  label: string;
  quantity: number;
  unitPrice: number;
};

export type MyTicket = {
  id: string;
  invoiceId: string;
  event: {
    title: string;
    image: string;
    genre: string;
    date: string;
    time: string;
    venue: string;
    city: string;
    slug: string;
    eventDate: string;
  };
  lineItems: TicketLineItem[];
  totalAmount: number;
  status: TicketStatus;
  purchasedAt: string;
};

// ── Real BE ticket schema ─────────────────────────────────────────────────

export enum BackendTicketStatus {
  VALID = 1,
  USED = 2,
  CANCELLED = 3,
  TRANSFERRED = 4,
}

const AmountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val));

export const BackendTicketSchema = z.object({
  id: BigIntIdSchema,
  code: z.string(),
  status: z.nativeEnum(BackendTicketStatus),
  event: z.object({
    id: BigIntIdSchema,
    eventName: z.string(),
    featuredImageUrl: z.string().optional(),
    eventDate: z.iso.datetime(),
    venue: VenueSchema,
    slug: z.string(),
  }),
  seat: z
    .object({
      row: z.string(),
      column: z.string(),
      seatIndex: z.number().int().nonnegative(),
    })
    .optional(),
  ticketType: z.object({
    id: BigIntIdSchema,
    name: z.string(),
    price: AmountSchema,
    currency: z.string(),
  }),
  checkedInAt: z.iso.datetime().nullable().optional(),
  createdAt: z.iso.datetime().optional(),
});
export type BackendTicket = z.infer<typeof BackendTicketSchema>;

export const TicketListResultSchema = PagedResponseSchema(BackendTicketSchema);
export type TicketListResult = z.infer<typeof TicketListResultSchema>;

// ── Order history ─────────────────────────────────────────────────────────

export const OrderItemSchema = z.object({
  ticketTypeName: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: AmountSchema,
  currency: z.string(),
});

export const OrderSchema = z.object({
  id: BigIntIdSchema,
  event: z.object({
    id: BigIntIdSchema,
    eventName: z.string(),
    featuredImageUrl: z.string().optional(),
    eventDate: z.iso.datetime(),
    venue: VenueSchema,
    slug: z.string(),
  }),
  items: z.array(OrderItemSchema),
  totalAmount: AmountSchema,
  currency: z.string().optional(),
  paidAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
});
export type Order = z.infer<typeof OrderSchema>;

export const OrderListResultSchema = PagedResponseSchema(OrderSchema);
export type OrderListResult = z.infer<typeof OrderListResultSchema>;

export const CheckInResultSchema = BaseResponseSchema(
  z.object({ success: z.boolean(), checkedInAt: z.iso.datetime().optional() }),
);
export type CheckInResult = z.infer<typeof CheckInResultSchema>;
