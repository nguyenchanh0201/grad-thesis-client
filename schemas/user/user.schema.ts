import { PHONE_RE } from "@/core/constants";
import { z } from "zod";
import { Role, ROLES } from "./role";
import { AcCOUNT_TYPES } from "./account-type";

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(60, "Name must be 60 characters or less"),
  email: z.email(),
  phone: z
    .string()
    .refine((val) => !val || PHONE_RE.test(val), "Invalid phone number")
    .optional(),
  role: z.enum(ROLES),
  accountType: z.enum(AcCOUNT_TYPES),
  profilePic: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ProfileUser = z.infer<typeof profileSchema>;

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name?: string;
  phone?: string;
};
