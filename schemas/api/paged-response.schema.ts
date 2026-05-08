import { z } from "zod";

export const PaginatedMetadataSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type PaginatedMetadata = z.infer<typeof PaginatedMetadataSchema>;

export const PagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    message: z.string().optional(),
    timestamp: z.iso.datetime().optional(),
    meta: PaginatedMetadataSchema,
  });
