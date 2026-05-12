import { z } from "zod";
import { BigIntIdSchema, BaseResponseSchema } from "../api";

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

// Raw shape returned by BE: flat array with integer status (0=available, 1=reserved, 2=sold)
const EventSeatRawSchema = z.object({
  id: BigIntIdSchema,
  eventId: BigIntIdSchema,
  ticketTypeId: BigIntIdSchema.nullable(),
  seatRow: z.string(),
  seatNumber: z.number().int(),
  seatLabel: z.string(),
  seatIndex: z.number().int().nonnegative(),
  status: z.number().int().min(0).max(2),
  expiredAt: z.iso.datetime().nullable().optional(),
  version: z.number().int().optional(),
});

const RAW_STATUS: Record<number, SeatAvailability["status"]> = {
  0: "available",
  1: "locked",
  2: "sold",
};

function groupRawSeats(
  raw: z.infer<typeof EventSeatRawSchema>[],
): SectionAvailability[] {
  const map = new Map<string, SeatAvailability[]>();
  for (const seat of raw) {
    if (!seat.ticketTypeId) continue;
    const mapped: SeatAvailability = {
      seatIndex: seat.seatIndex,
      seatRow: seat.seatRow,
      seatNumber: seat.seatNumber,
      seatLabel: seat.seatLabel,
      status: RAW_STATUS[seat.status] ?? "sold",
    };
    const existing = map.get(seat.ticketTypeId);
    if (existing) {
      existing.push(mapped);
    } else {
      map.set(seat.ticketTypeId, [mapped]);
    }
  }
  return Array.from(map.entries()).map(([ticketTypeId, seats]) => ({
    ticketTypeId,
    seats,
  }));
}

export const EventSeatsDataSchema = z
  .array(EventSeatRawSchema)
  .transform(groupRawSeats);
export type EventSeatsData = z.infer<typeof EventSeatsDataSchema>;

export const EventSeatsResultSchema = BaseResponseSchema(EventSeatsDataSchema);
export type EventSeatsResult = z.infer<typeof EventSeatsResultSchema>;
