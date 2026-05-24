import { PHONE_RE } from "@/core/constants";
import { z } from "zod";
import type { Role } from "./role";
import type { AcCOUNT_TYPES } from "./account-type";

// Validator for the profile edit form — only the editable fields
export const profileFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(60, "Name must be 60 characters or less"),
  phone: z
    .string()
    .refine((val) => !val || PHONE_RE.test(val), "Invalid phone number")
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export type ProfileUser = {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  accountType: AcCOUNT_TYPES;
  profilePic?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  name?: string;
  phone?: string;
};
