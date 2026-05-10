"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProfileFormValues, profileSchema } from "@/schemas/user";
import { ROLES } from "@/schemas/user/role";
import { UserProfilePicture } from "./profile-picture";
import { useUpdateUserProfile, useUserProfile } from "@/hooks/user-profile";
import { AcCOUNT_TYPES } from "@/schemas/user/account-type";

export function ProfileSettings() {
  const { data: user } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
    },
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
        <UserProfilePicture email={user.email} imageUrl={user.profilePic} />
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
            {user.accountType && (
              <Badge variant="secondary" className="text-xs">
                {user.accountType}
              </Badge>
            )}
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
