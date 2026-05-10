import { z } from "zod";
import { BigIntIdSchema } from "../api";
import { VenueSchema } from "../venue";
import { TicketTypeSchema } from "../ticket-type";
import { CategorySchema } from "../category";
import { TagSchema } from "../tag";
import { PerformerSchema } from "./performer.schema";
import { EventOrganizerSchema } from "./organizer.schema";

export enum EventStatus {
  DRAFT = 0,
  ON_SALE = 2,
  SOLD_OUT = 3,
  FINISHED = 4,
  CANCELLED = 5,
}

export const EventSchema = z.object({
  id: BigIntIdSchema.optional(),

  createdAt: z.iso.datetime().nullish(),
  updatedAt: z.iso.datetime().nullish(),
  deletedAt: z.iso.datetime().nullish(),

  eventCode: z.string().max(32),
  eventName: z.string().max(255),
  summary: z.string().nullish(),
  desc: z.string().nullish(),
  descAttachmentUrl: z.string().nullish(),
  termsAndConditions: z.string().nullish(),

  venue: VenueSchema.nullish(),
  venueId: BigIntIdSchema.nullish(),

  category: CategorySchema.nullish(),
  categoryId: BigIntIdSchema.nullish(),

  tags: z.array(TagSchema).optional(),

  organizerId: BigIntIdSchema.nullish(),
  organizer: EventOrganizerSchema.nullish(),

  eventDate: z.iso.datetime(),
  saleStartDate: z.iso.datetime(),
  saleEndDate: z.iso.datetime(),
  lobbyStartDate: z.iso.datetime().nullish(),

  status: z.nativeEnum(EventStatus),
  slug: z.string(),

  isFeatured: z.boolean().nullish(),
  isSeated: z.boolean().nullish(),

  maxTicketsPerOrder: z.number().int().positive().nullish(),
  maxTicketsPerUser: z.number().int().positive().nullish(),

  featuredImageUrl: z.string().nullish(),
  eventImageUrls: z.array(z.string()).optional(),

  socialLinks: z
    .object({
      facebook: z.string().nullish(),
      website: z.string().nullish(),
      instagram: z.string().nullish(),
      twitter: z.string().nullish(),
    })
    .nullish(),

  ticketTypes: z.array(TicketTypeSchema).optional(),
  performers: z.array(PerformerSchema).optional(),

  cancelReason: z.string().nullish(),
  publishedAt: z.iso.datetime().nullish(),
  cancelledAt: z.iso.datetime().nullish(),
  finishedAt: z.iso.datetime().nullish(),
});

export type Event = z.infer<typeof EventSchema>;
