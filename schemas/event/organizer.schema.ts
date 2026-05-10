import { z } from "zod";
import { BigIntIdSchema } from "../api";

export const EventOrganizerSchema = z.object({
  id: BigIntIdSchema,
  displayName: z.string(),
  avatarUrl: z.string().nullish(),
  bio: z.string().nullish(),
  contactInfo: z
    .object({
      email: z.string().nullish(),
      phone: z.string().nullish(),
      website: z.string().nullish(),
      facebook: z.string().nullish(),
      instagram: z.string().nullish(),
    })
    .nullish(),
});

export type EventOrganizer = z.infer<typeof EventOrganizerSchema>;
