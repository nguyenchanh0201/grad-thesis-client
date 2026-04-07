import { z } from "zod";

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.string().datetime(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
