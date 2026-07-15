import { z } from "zod";

export const CreateTicketTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  currency: z.string().default("VND"),
  quantity: z.number().int().positive(),
});
export type CreateTicketTypeDTO = z.infer<typeof CreateTicketTypeSchema>;
