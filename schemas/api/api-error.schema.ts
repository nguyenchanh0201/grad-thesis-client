import { z } from "zod";

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  statusCode: z.number().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    path: z.string().optional(),
    timestamp: z.string().datetime(),
    details: z
      .array(z.object({ field: z.string(), message: z.string() }))
      .optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
