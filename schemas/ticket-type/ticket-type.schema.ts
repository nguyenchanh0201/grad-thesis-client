import { z } from "zod";
import { BigIntIdSchema } from "../api";

const CentsSchema = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val));

export const TicketTypeSchema = z.object({
  id: BigIntIdSchema,
  eventId: BigIntIdSchema,
  name: z.string(),
  description: z.string().optional(),
  price: CentsSchema,
  currency: z.string(),
  quantity: z.number().int().nonnegative().optional(),
  soldCount: z.number().int().nonnegative().optional(),
});

export type TicketType = z.infer<typeof TicketTypeSchema>;
