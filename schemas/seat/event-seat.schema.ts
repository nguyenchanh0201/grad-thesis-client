import { z } from "zod";
import { BaseResponseSchema } from "../api";

export const SeatAvailabilitySchema = z.object({
  seatIndex: z.number().int().nonnegative(),
  seatRow: z.string(),
  seatNumber: z.number().int(),
  seatLabel: z.string(),
  status: z.enum(["available", "locked", "sold"]),
});
export type SeatAvailability = z.infer<typeof SeatAvailabilitySchema>;

export const SectionAvailabilitySchema = z.object({
  ticketTypeId: z.string(),
  seats: z.array(SeatAvailabilitySchema),
});
export type SectionAvailability = z.infer<typeof SectionAvailabilitySchema>;

export const EventSeatsDataSchema = z.array(SectionAvailabilitySchema);
export type EventSeatsData = z.infer<typeof EventSeatsDataSchema>;

export const EventSeatsResultSchema = BaseResponseSchema(EventSeatsDataSchema);
export type EventSeatsResult = z.infer<typeof EventSeatsResultSchema>;
