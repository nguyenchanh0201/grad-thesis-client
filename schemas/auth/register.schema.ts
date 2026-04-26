import { z } from "zod";

export const RegisterSchema = z
  .object({
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Must include at least one uppercase letter.")
      .regex(/[0-9]/, "Must include at least one number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: "You must agree to the Terms and Conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;
