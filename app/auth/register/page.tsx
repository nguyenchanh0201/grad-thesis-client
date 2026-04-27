"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { InputField } from "@/components/auth/input-field";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { RegisterSchema, type RegisterInput } from "@/schemas/auth";
import { getAuthErrorMessage } from "@/services/auth.service";
import { useRegister } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { mutate: registerUser, isPending, error } = useRegister();
  const authError = error ? getAuthErrorMessage(error) : null;

  const {
    register,
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

          <div className="flex gap-2 items-center">
            <Checkbox
              id="agreeToTerms"
              {...register("agreeToTerms")}
              aria-errormessage={errors.agreeToTerms?.message}
            />
            <Label htmlFor="agreeToTerms">
              I agree to TicketGo&apos;s{" "}
              <Link
                href="/terms"
                className="font-medium text-primary hover:underline underline-offset-4 leading-none"
                onClick={(e) => e.stopPropagation()}
              >
                Terms and Conditions
              </Link>
            </Label>
          </div>

          <Button
            variant="default"
            disabled={isPending}
            className="w-full py-6"
          >
            Continue
          </Button>
        </form>

        <Separator />
        <p className="text-shadow-muted-foreground text-center">
          Or register with
        </p>
        <GoogleButton disabled={isPending} />

        <AuthFooterLink
          text="Already have an account?"
          linkLabel="Log in"
          href="/auth/login"
        />
      </div>
    </AuthCard>
  );
}
