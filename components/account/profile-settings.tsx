"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useUpdateProfile } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/store/auth.store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const ROLE_LABELS: Record<string, string> = {
  USER: "Member",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const PHONE_RE = /^\+?[\d\s\-()\[\]]{7,20}$/;

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(60, "Name must be 60 characters or less"),
  phone: z
    .string()
    .refine((val) => !val || PHONE_RE.test(val), "Invalid phone number")
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function ProfileSettings() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  useEffect(() => {
    reset({ name: user?.name ?? "", phone: user?.phone ?? "" });
  }, [user, reset]);

  if (!user) return null;

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(
      { name: values.name, phone: values.phone ?? "" },
      {
        onSuccess: () => toast.success("Profile updated"),
        onError: () => toast.error("Failed to update profile"),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      {/* Avatar + identity */}
      <div className="flex items-center gap-4 mb-8">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary select-none">
          {getInitials(user.email)}
        </span>
        <div>
          <p className="text-lg font-semibold leading-tight">
            {user.name || "No name set"}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Account info — read-only */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3">Account</h2>
        <div className="rounded-md border bg-muted/30 divide-y">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Account type</span>
            <Badge variant="secondary" className="text-xs">
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Email and account type cannot be changed here.
        </p>
      </section>

      <Separator className="mb-6" />

      {/* Editable profile fields */}
      <section>
        <h2 className="text-base font-semibold mb-4">Profile Information</h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              {...register("phone")}
            />
            {errors.phone && (
              <p
                id="phone-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={!isDirty || updateProfile.isPending}
              className="min-w-24"
            >
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
