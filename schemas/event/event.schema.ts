import { z } from "zod";
import { BigIntIdSchema } from "../api";
import { VenueSchema } from "../venue";
import { TicketTypeSchema } from "../ticket-type";

export enum EventStatus {
  DRAFT = 0,
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

  venue: VenueSchema,

  eventDate: z.iso.datetime(),
  saleStartDate: z.iso.datetime(),
  saleEndDate: z.iso.datetime(),
  lobbyStartDate: z.iso.datetime().nullable().optional(),

  status: z.nativeEnum(EventStatus),
  slug: z.string(),

  isFeatured: z.boolean().optional(),
  featuredImageUrl: z.string().optional(),
  eventImageUrls: z.array(z.string()).optional(),

  ticketTypes: z.array(TicketTypeSchema).optional(),
});

export type Event = z.infer<typeof EventSchema>;
