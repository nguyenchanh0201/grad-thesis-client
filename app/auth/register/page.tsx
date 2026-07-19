"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { InputField } from "@/components/auth/input-field";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { AuthSocialActions } from "@/components/auth/auth-social-actions";
import { RegisterSchema, type RegisterInput } from "@/schemas/auth";
import { getAuthErrorMessage } from "@/services/auth.service";
import { useRegister } from "@/hooks/use-auth";
import { withRedirectQuery } from "@/lib/auth/redirect";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { mutate: registerUser, isPending, error } = useRegister();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const callbackError = searchParams.get("error");
  const authError = error
    ? getAuthErrorMessage(error)
    : callbackError === "google_not_enabled"
      ? "Google sign-in is not enabled on the backend. Please use email and password."
      : callbackError === "google_failed"
        ? "Google sign-in could not be completed. Please try again or use email and password."
        : null;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = (data: RegisterInput) => {
    registerUser({ email: data.email, password: data.password });
  };

  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Register Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your account to get started.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          {authError && (
            <div
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
            >
              {authError}
            </div>
          )}

          <InputField
            id="reg-email"
            type="email"
            icon="mail"
            placeholder="Enter email address"
            autoComplete="email"
            aria-label="Email address"
            {...register("email")}
            error={errors.email?.message}
          />

          <InputField
            id="reg-password"
            type="password"
            icon="lock"
            placeholder="Enter password"
            autoComplete="new-password"
            showToggle
            aria-label="Password"
            {...register("password")}
            error={errors.password?.message}
          />

          <InputField
            id="reg-confirm-password"
            type="password"
            icon="lock"
            placeholder="Confirm password"
            autoComplete="new-password"
            showToggle
            aria-label="Confirm password"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Controller
                name="agreeToTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="agreeToTerms"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                    onBlur={field.onBlur}
                    aria-invalid={!!errors.agreeToTerms}
                    aria-describedby={
                      errors.agreeToTerms ? "agree-to-terms-error" : undefined
                    }
                  />
                )}
              />
              <Label
                htmlFor="agreeToTerms"
                className="block min-w-0 flex-1 text-sm leading-snug"
              >
                I agree to TicketGo&apos;s{" "}
                <Link
                  href="/terms"
                  className="inline font-medium text-primary hover:underline underline-offset-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms and Conditions
                </Link>
              </Label>
            </div>
            {errors.agreeToTerms?.message && (
              <p id="agree-to-terms-error" className="text-sm text-destructive">
                {errors.agreeToTerms.message}
              </p>
            )}
          </div>

          <Button
            variant="default"
            disabled={isPending}
            className="w-full py-6"
          >
            Continue
          </Button>
        </form>

        <AuthSocialActions authPath="/auth/register" disabled={isPending} />

        <AuthFooterLink
          text="Already have an account?"
          linkLabel="Log in"
          href={withRedirectQuery("/auth/login", redirect)}
        />
      </div>
    </AuthCard>
  );
}
