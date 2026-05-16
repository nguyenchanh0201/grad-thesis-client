import { z } from "zod";
import { BigIntIdSchema, BaseResponseSchema } from "../api";

const TagStatusLabelSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const TagStatusSchema = z
  .union([z.literal(0), z.literal(1), z.literal(2), TagStatusLabelSchema])
  .transform((status) => {
    if (status === 0) return "PENDING";
    if (status === 1) return "APPROVED";
    if (status === 2) return "REJECTED";
    return status;
  });
export type TagStatus = z.infer<typeof TagStatusSchema>;

export const TagSchema = z.object({
  id: BigIntIdSchema,
  name: z.string(),
  slug: z.string().optional(),
  metaDescription: z.string().optional(),
  isTrending: z.boolean().optional(),
  status: TagStatusSchema.optional(),
});
export type Tag = z.infer<typeof TagSchema>;

export const TagResultSchema = BaseResponseSchema(TagSchema);
export type TagResult = z.infer<typeof TagResultSchema>;

export const TagListResultSchema = BaseResponseSchema(z.array(TagSchema));
export type TagListResult = z.infer<typeof TagListResultSchema>;
