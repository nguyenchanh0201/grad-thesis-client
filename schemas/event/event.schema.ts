import { z } from "zod";
import { BigIntIdSchema } from "../api";

export enum EventStatus {
  DRAFT = 0,
  UPCOMING = 1,
  ON_SALE = 2,
  SOLD_OUT = 3,
  FINISHED = 4,
  CANCELLED = 5,
}

export const EventSchema = z.object({
  id: BigIntIdSchema,

  createdAt: z.iso.datetime().optional(),
  updatedAt: z.iso.datetime().optional(),
  deletedAt: z.iso.datetime().nullable().optional(),

  eventCode: z.string().max(32),
  eventName: z.string().max(255),
  desc: z.string().nullable().optional(),
  venue: z.string().max(255),

  eventDate: z.iso.datetime(),
  saleStartDate: z.iso.datetime(),
  saleEndDate: z.iso.datetime(),

  status: z.enum(EventStatus),
  slug: z.string(),
});

export type Event = z.infer<typeof EventSchema>;
