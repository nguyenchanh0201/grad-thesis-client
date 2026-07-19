import { z } from "zod";

import {
  BaseResponseSchema,
  BigIntIdSchema,
  PagedResponseSchema,
} from "../api";
import { EventSchema } from "./event.schema";
import { EventDetailSchema } from "./event-detail.schema";
import { TicketTypeSchema } from "../ticket-type";
import { EventStatus } from "./event.schema";

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

const BuyPageEventSchema = z
  .object({
    eventCode: z.string(),
    slug: z.string(),
    title: z.string(),
    images: z.array(z.string()).default([]),
    dates: z
      .array(
        z.object({
          label: z.string(),
          startTime: z.iso.datetime(),
          endTime: z.iso.datetime().nullish(),
        }),
      )
      .min(1),
    venue: z.object({
      name: z.string(),
      address: z.string(),
      city: z.string(),
    }),
    ticketTypes: z.array(TicketTypeSchema).optional(),
    mapType: z.string().optional(),
    seatMapImage: z.string().nullish(),
  })
  .transform((event) => ({
    eventCode: event.eventCode,
    eventName: event.title,
    summary: null,
    desc: "",
    descAttachmentUrl: null,
    termsAndConditions: null,
    venue: {
      id: "",
      venueName: event.venue.name,
      address: event.venue.address,
      city: event.venue.city,
      country: null,
      latitude: null,
      longitude: null,
      placeId: null,
    },
    venueId: null,
    category: null,
    categoryId: null,
    tags: [],
    organizerId: null,
    organizer: null,
    eventDate: event.dates[0].startTime,
    saleStartDate: event.dates[0].startTime,
    saleEndDate: event.dates[0].endTime ?? event.dates[0].startTime,
    lobbyStartDate: null,
    status: EventStatus.ON_SALE,
    slug: event.slug,
    isFeatured: null,
    isSeated: event.mapType === "seated",
    seatMap: event.seatMapImage
      ? {
          id: "",
          name: null,
          previewImageUrl: event.seatMapImage,
          canvas: undefined,
        }
      : null,
    maxTicketsPerOrder: null,
    maxTicketsPerUser: null,
    featuredImageUrl: event.images[0] ?? event.seatMapImage ?? null,
    eventImageUrls: event.images,
    socialLinks: null,
    ticketTypes: event.ticketTypes,
    performers: [],
    cancelReason: null,
    publishedAt: null,
    cancelledAt: null,
    finishedAt: null,
  }));

export const EventDetailResultSchema = BaseResponseSchema(
  z.union([EventSchema, BuyPageEventSchema]),
);
export type EventDetailResult = z.infer<typeof EventDetailResultSchema>;

export const EventDetailPageResultSchema =
  BaseResponseSchema(EventDetailSchema);
export type EventDetailPageResult = z.infer<typeof EventDetailPageResultSchema>;
