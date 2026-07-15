import { PAGINATION } from "@/core/constants";
import { z } from "zod";
import { EventStatus } from "./event.schema";

export const GetEventsParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .min(PAGINATION.MIN_LIMIT)
    .optional()
    .default(PAGINATION.DEFAULT_LIMIT),
  organizerId: z.string().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  category: z.string().optional(),
  venue: z.string().optional(),
  eventDateFrom: z.iso.datetime().optional(),
  eventDateTo: z.iso.datetime().optional(),
});

export type GetEventsParams = z.infer<typeof GetEventsParamsSchema>;
