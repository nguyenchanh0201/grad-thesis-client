import { z } from "zod";

import { BaseResponseSchema } from "./base-response.schema";

export const UserRoleSchema = z.enum([
  "USER",
  "ORGANIZER",
  "ADMIN",
  "SUPER_ADMIN",
]);

export const CurrentUserSchema = z.object({
  id: z.string().min(1),
  role: UserRoleSchema,
});

export type CurrentUser = z.infer<typeof CurrentUserSchema>;

export const IdentityMeDataSchema = z.object({
  msg: z.string(),
  user: CurrentUserSchema,
});

export type IdentityMeData = z.infer<typeof IdentityMeDataSchema>;

export const IdentityMeResponseSchema =
  BaseResponseSchema(IdentityMeDataSchema);

export type IdentityMeResponse = z.infer<typeof IdentityMeResponseSchema>;
