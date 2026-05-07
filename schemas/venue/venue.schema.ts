import { z } from "zod";
import { BigIntIdSchema } from "../api";

export const VenueSchema = z.object({
  id: BigIntIdSchema,
  name: z.string(),
  address: z.string().optional(),
  city: z.string(),
  country: z.string().optional(),
});

export type Venue = z.infer<typeof VenueSchema>;
