import { z } from "zod";
import { BigIntIdSchema } from "../api";

const AmountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val));

const BackendTicketTypeSchema = z.object({
  id: BigIntIdSchema,
  eventId: BigIntIdSchema,
  typeName: z.string(),
  desc: z.string().nullish(),
  price: AmountSchema,
  currency: z.string(),
  totalQuantity: z.number().int().nonnegative(),
  availableQuantity: z.number().int().nonnegative(),
});

const FrontendTicketTypeSchema = z.object({
  id: BigIntIdSchema,
  eventId: BigIntIdSchema,
  name: z.string(),
  description: z.string().nullish(),
  price: AmountSchema,
  currency: z.string(),
  quantity: z.number().int().nonnegative().optional(),
  soldCount: z.number().int().nonnegative().optional(),
});

export const TicketTypeSchema = z
  .union([FrontendTicketTypeSchema, BackendTicketTypeSchema])
  .transform((ticketType) => {
    if ("typeName" in ticketType) {
      return {
        id: ticketType.id,
        eventId: ticketType.eventId,
        name: ticketType.typeName,
        description: ticketType.desc ?? undefined,
        price: ticketType.price,
        currency: ticketType.currency,
        quantity: ticketType.totalQuantity,
        soldCount: Math.max(
          0,
          ticketType.totalQuantity - ticketType.availableQuantity,
        ),
      };
    }

    return {
      ...ticketType,
      description: ticketType.description ?? undefined,
    };
  });

export type TicketType = z.infer<typeof TicketTypeSchema>;
