import { z } from "zod";
import { BigIntIdSchema, BaseResponseSchema } from "../api";

export const TagStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type TagStatus = z.infer<typeof TagStatusSchema>;

export const TagSchema = z.object({
  id: BigIntIdSchema,
  name: z.string(),
  metaDescription: z.string().optional(),
  status: TagStatusSchema.optional(),
});
export type Tag = z.infer<typeof TagSchema>;

export const TagResultSchema = BaseResponseSchema(TagSchema);
export type TagResult = z.infer<typeof TagResultSchema>;

export const TagListResultSchema = BaseResponseSchema(z.array(TagSchema));
export type TagListResult = z.infer<typeof TagListResultSchema>;
