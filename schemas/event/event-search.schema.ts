import { z } from "zod";
import { EventStatus } from "./event.schema";

export const SearchEventsParamsSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  eventDateFrom: z.iso.datetime().optional(),
  eventDateTo: z.iso.datetime().optional(),
  venueCity: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).optional(),
});
export type SearchEventsParams = z.infer<typeof SearchEventsParamsSchema>;
