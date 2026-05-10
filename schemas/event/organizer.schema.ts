import { z } from "zod";
import { BigIntIdSchema } from "../api";

export const EventOrganizerSchema = z.object({
  id: BigIntIdSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullish(),
  bio: z.string().nullish(),
  contactInfo: z
    .object({
      email: z.email().optional(),
      phone: z.string().optional(),
      website: z.url().optional(),
      facebook: z.url().optional(),
      instagram: z.url().optional(),
    })
    .optional(),
});

export type EventOrganizer = z.infer<typeof EventOrganizerSchema>;
