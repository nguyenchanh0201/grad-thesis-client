import { apiClient } from "@/lib/api/api-client";
import { parseOrThrow } from "@/lib/api/api-utils";
import {
  CategoryListResult,
  CategoryListResultSchema,
  CategoryResult,
  CategoryResultSchema,
  CreateCategoryDTO,
} from "@/schemas/category";
import { TagListResult, TagListResultSchema } from "@/schemas/tag";
import {
  GetVenuesParams,
  VenueListResult,
  VenueListResultSchema,
  VenueResult,
  VenueResultSchema,
} from "@/schemas/venue";

export const getCategories = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CategoryListResult> => {
  const response = await apiClient.get("/categories", { params });
  return parseOrThrow(CategoryListResultSchema, response);
};

export const getCategoryById = async (id: string): Promise<CategoryResult> => {
  const response = await apiClient.get(`/categories/${id}`);
  return parseOrThrow(CategoryResultSchema, response);
};

export const createCategory = async (
  payload: CreateCategoryDTO,
): Promise<CategoryResult> => {
  const response = await apiClient.post("/categories", payload);
  return parseOrThrow(CategoryResultSchema, response);
};

export const updateCategory = async (
  id: string,
  payload: Partial<CreateCategoryDTO>,
): Promise<CategoryResult> => {
  const response = await apiClient.patch(`/categories/${id}`, payload);
  return parseOrThrow(CategoryResultSchema, response);
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};

export const getVenues = async (
  params?: GetVenuesParams,
): Promise<VenueListResult> => {
  const response = await apiClient.get("/venues", { params });
  return parseOrThrow(VenueListResultSchema, response);
};

export const getVenueById = async (id: string): Promise<VenueResult> => {
  const response = await apiClient.get(`/venues/${id}`);
  return parseOrThrow(VenueResultSchema, response);
};

export const getTags = async (): Promise<TagListResult> => {
  const response = await apiClient.get("/tags");
  return parseOrThrow(TagListResultSchema, response);
};

export const getAllTagsAdmin = async (): Promise<TagListResult> => {
  const response = await apiClient.get("/tags/admin/all");
  return parseOrThrow(TagListResultSchema, response);
};

export const moderateTag = async (id: string, status: 1 | 2): Promise<void> => {
  await apiClient.patch(`/tags/admin/${id}/moderate`, { status });
};
