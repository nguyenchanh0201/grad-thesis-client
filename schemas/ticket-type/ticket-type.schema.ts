import { z } from "zod";
import { BigIntIdSchema } from "../api";

const AmountSchema = z
  .union([z.string(), z.number()])
  .transform((val) => Number(val));

const BackendTicketTypeSchema = z.object({
  id: BigIntIdSchema,
  eventId: BigIntIdSchema.optional(),
  typeName: z.string(),
  desc: z.string().nullish(),
  price: AmountSchema,
  currency: z.string().optional(),
  totalQuantity: z.number().int().nonnegative(),
  availableQuantity: z.number().int().nonnegative().optional(),
});

const BuyPageTicketTypeSchema = z.object({
  id: BigIntIdSchema,
  zoneId: BigIntIdSchema.optional(),
  label: z.string(),
  price: AmountSchema,
  quantity: z.number().int().nonnegative(),
  colorKey: z.string().optional(),
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
  .union([
    FrontendTicketTypeSchema,
    BackendTicketTypeSchema,
    BuyPageTicketTypeSchema,
  ])
  .transform((ticketType) => {
    if ("typeName" in ticketType) {
      return {
        id: ticketType.id,
        eventId: ticketType.eventId ?? "",
        name: ticketType.typeName,
        description: ticketType.desc ?? undefined,
        price: ticketType.price,
        currency: ticketType.currency ?? "VND",
        quantity: ticketType.totalQuantity,
        soldCount:
          ticketType.availableQuantity == null
            ? undefined
            : Math.max(
                0,
                ticketType.totalQuantity - ticketType.availableQuantity,
              ),
      };
    }

    if ("label" in ticketType) {
      return {
        id: ticketType.id,
        eventId: "",
        name: ticketType.label,
        description: undefined,
        price: ticketType.price,
        currency: "VND",
        quantity: ticketType.quantity,
        soldCount: undefined,
      };
    }

    return {
      ...ticketType,
      description: ticketType.description ?? undefined,
    };
  });

export type TicketType = z.infer<typeof TicketTypeSchema>;
