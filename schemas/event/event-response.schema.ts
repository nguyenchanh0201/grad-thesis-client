import { z } from "zod";

import {
  BaseResponseSchema,
  BigIntIdSchema,
  PagedResponseSchema,
} from "../api";
import { EventSchema } from "./event.schema";
import { EventDetailSchema } from "./event-detail.schema";

export const EventSearchItemSchema = z.object({
  id: BigIntIdSchema,
  eventCode: z.string(),
  slug: z.string(),
  eventName: z.string(),
  desc: z.string().nullish(),
  featuredImageUrl: z.string().nullish(),
  status: z.number(),
  isFeatured: z.boolean(),
  isSeated: z.boolean(),
  eventDate: z.iso.datetime(),
  saleStartDate: z.iso.datetime(),
  saleEndDate: z.iso.datetime(),
  organizerId: BigIntIdSchema,
  venue: z
    .object({
      id: BigIntIdSchema,
      name: z.string().nullish(),
      city: z.string().nullish(),
      country: z.string().nullish(),
    })
    .nullish()
    .transform((venue) =>
      venue
        ? {
            id: venue.id,
            venueName: venue.name,
            city: venue.city,
            country: venue.country,
          }
        : null,
    ),
  category: z.object({
    id: BigIntIdSchema,
    name: z.string(),
    slug: z.string().optional(),
  }),
  tags: z.array(
    z.object({
      id: BigIntIdSchema,
      name: z.string(),
      slug: z.string().optional(),
    }),
  ),
  minPrice: z.number(),
  maxPrice: z.number(),
  currency: z.string().nullish(),
  createdAt: z.iso.datetime(),
});
export type EventSearchItem = z.infer<typeof EventSearchItemSchema>;

export const EventPagedListResultSchema = PagedResponseSchema(
  EventSearchItemSchema,
);
export type EventPagedListResult = z.infer<typeof EventPagedListResultSchema>;

export const EventDetailResultSchema = BaseResponseSchema(EventSchema);
export type EventDetailResult = z.infer<typeof EventDetailResultSchema>;

export const EventDetailPageResultSchema =
  BaseResponseSchema(EventDetailSchema);
export type EventDetailPageResult = z.infer<typeof EventDetailPageResultSchema>;
