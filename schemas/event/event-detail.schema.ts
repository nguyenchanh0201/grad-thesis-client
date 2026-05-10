import { z } from "zod";
import { BigIntIdSchema } from "../api";
import { EventStatus } from "./event.schema";
import { PerformerSchema } from "./performer.schema";
import { EventOrganizerSchema } from "./organizer.schema";

export const EventDateSchema = z.object({
  date: z.string(),
  label: z.string(),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime().optional(),
});

export const EventVenueDetailSchema = z.object({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  mapUrl: z.url().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const EventItemSchema = z.object({
  id: z.string(),
  image: z.string(),
  genre: z.string().optional(),
  title: z.string(),
  date: z.string().optional(),
  venue: z.string().optional(),
  price: z.string().optional(),
  tag: z.string().optional(),
});

export const EventDetailSchema = z.object({
  id: BigIntIdSchema,
  slug: z.string(),
  title: z.string().max(255),
  images: z.array(z.string()).min(1),
  status: z.nativeEnum(EventStatus),
  dates: z.array(EventDateSchema).min(1),
  venue: EventVenueDetailSchema,
  organizer: EventOrganizerSchema,
  summary: z.string().optional(),
  description: z.string(),
  descAttachmentUrl: z.url().optional(),
  seatMapImage: z.string().optional(),
  termsAndConditions: z.string(),
  tags: z.array(z.string()).optional(),
  followerCount: z.number().int().nonnegative().optional(),
  lowestPrice: z.number().nonnegative().optional(),
  performerName: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.url().optional(),
      website: z.url().optional(),
      instagram: z.url().optional(),
      twitter: z.url().optional(),
    })
    .optional(),
  relatedEvents: z.array(EventItemSchema),
  performers: z.array(PerformerSchema).optional(),
});

export type EventDate = z.infer<typeof EventDateSchema>;
export type EventVenueDetail = z.infer<typeof EventVenueDetailSchema>;
export type EventItemDetail = z.infer<typeof EventItemSchema>;
export type EventDetail = z.infer<typeof EventDetailSchema>;
