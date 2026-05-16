import { z } from "zod";

import { BaseResponseSchema } from "./base-response.schema";

export const UserRoleSchema = z.enum([
  "USER",
  "ORGANIZER",
  "ADMIN",
  "SUPER_ADMIN",
]);

export const AccountTypeSchema = z.enum(["Member", "VIP"]);

export const OrganizerContactInfoSchema = z.object({
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
});

export const OrganizerProfileSchema = z.object({
  displayName: z.string().min(1),
  avatarUrl: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  contactInfo: OrganizerContactInfoSchema.optional().nullable(),
});

export const CurrentUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  accountType: AccountTypeSchema.optional().nullable(),
  isOrganizer: z.boolean().optional(),
  organizerProfile: OrganizerProfileSchema.optional().nullable(),
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
