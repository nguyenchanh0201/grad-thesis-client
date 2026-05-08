import { z } from "zod";
import {
  BigIntIdSchema,
  BaseResponseSchema,
  PagedResponseSchema,
} from "../api";

export const CategorySchema = z.object({
  id: BigIntIdSchema,
  name: z.string(),
  slug: z.string().optional(),
  metaDescription: z.string().optional(),
  iconName: z.string().optional(),
  colorCode: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoryResultSchema = BaseResponseSchema(CategorySchema);
export type CategoryResult = z.infer<typeof CategoryResultSchema>;

export const CategoryListResultSchema = PagedResponseSchema(CategorySchema);
export type CategoryListResult = z.infer<typeof CategoryListResultSchema>;

export const CreateCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  metaDescription: z.string().optional(),
  iconName: z.string().optional(),
  colorCode: z.string().optional(),
  imageUrl: z.string().optional(),
});
export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;
