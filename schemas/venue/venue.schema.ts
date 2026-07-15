import { z } from "zod";
import {
  BigIntIdSchema,
  BaseResponseSchema,
  PagedResponseSchema,
} from "../api";

export const VenueSchema = z.object({
  id: BigIntIdSchema,
  venueName: z.string().nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  country: z.string().nullish(),
  latitude: z.string().nullish(),
  longitude: z.string().nullish(),
  placeId: z.string().nullish(),
});
export type Venue = z.infer<typeof VenueSchema>;

export const VenueResultSchema = BaseResponseSchema(VenueSchema);
export type VenueResult = z.infer<typeof VenueResultSchema>;

export const VenueListResultSchema = PagedResponseSchema(VenueSchema);
export type VenueListResult = z.infer<typeof VenueListResultSchema>;

export const GetVenuesParamsSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  search: z.string().optional(),
});
export type GetVenuesParams = z.infer<typeof GetVenuesParamsSchema>;
