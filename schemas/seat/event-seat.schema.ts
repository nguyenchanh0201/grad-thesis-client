import { z } from "zod";
import { BaseResponseSchema } from "../api";

export const SeatStatusSchema = z.enum([
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "UNAVAILABLE",
]);
export type SeatStatus = z.infer<typeof SeatStatusSchema>;

export const EventSeatSchema = z.object({
  seatIndex: z.number().int().nonnegative(),
  row: z.string(),
  column: z.string(),
  status: SeatStatusSchema,
  label: z.string().optional(),
});
export type EventSeat = z.infer<typeof EventSeatSchema>;

export const SeatRowSchema = z.object({
  row: z.string(),
  seats: z.array(EventSeatSchema),
});
export type SeatRow = z.infer<typeof SeatRowSchema>;

export const EventSeatsDataSchema = z.object({
  rows: z.array(SeatRowSchema),
  seatMapType: z.enum(["theater", "zone", "stadium"]).optional(),
});
export type EventSeatsData = z.infer<typeof EventSeatsDataSchema>;

export const EventSeatsResultSchema = BaseResponseSchema(EventSeatsDataSchema);
export type EventSeatsResult = z.infer<typeof EventSeatsResultSchema>;
