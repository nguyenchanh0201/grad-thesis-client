import { z } from "zod";
import { BaseResponseSchema } from "../api";

const CentsSchema = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val));

export const EventStatsSchema = z.object({
  totalCapacity: z.number().int().nonnegative(),
  soldCount: z.number().int().nonnegative(),
  availableCount: z.number().int().nonnegative(),
  occupancyRate: z.number().nonnegative(),
  checkedInCount: z.number().int().nonnegative(),
  totalRevenue: CentsSchema,
});
export type EventStats = z.infer<typeof EventStatsSchema>;

export const EventStatsResultSchema = BaseResponseSchema(EventStatsSchema);
export type EventStatsResult = z.infer<typeof EventStatsResultSchema>;
