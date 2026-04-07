import { z } from "zod";

export const PaginatedMetadataSchema = z.object({
  totalItems: z.number(),
  itemCount: z.number(),
  itemsPerPage: z.number(),
  totalPages: z.number(),
  currentPage: z.number(),
});

export type PaginatedMetadata = z.infer<typeof PaginatedMetadataSchema>;

export const PagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    message: z.string().optional(),
    timestamp: z.string().datetime(),
    meta: PaginatedMetadataSchema,
  });
