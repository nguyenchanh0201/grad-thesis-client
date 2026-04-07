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
  search: z.string().optional(),
  status: z.enum(EventStatus).optional(),
  dateFrom: z.iso.datetime().optional(),
  dateTo: z.iso.datetime().optional(),
});

export type GetEventsParams = z.infer<typeof GetEventsParamsSchema>;
