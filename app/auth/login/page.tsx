"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { InputField } from "@/components/auth/input-field";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { AuthSocialActions } from "@/components/auth/auth-social-actions";
import { LoginSchema, type LoginInput } from "@/schemas/auth";
import { getAuthErrorMessage } from "@/services/auth.service";
import { useLogin } from "@/hooks/use-auth";
import { withRedirectQuery } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();
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
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = (data: LoginInput) => {
    login(data);
  };

  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Log in
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Please enter your details.
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
            id="email"
            type="email"
            icon="mail"
            placeholder="Enter email address"
            autoComplete="email"
            aria-label="Email address"
            {...register("email")}
            error={errors.email?.message}
          />

          <InputField
            id="password"
            type="password"
            icon="lock"
            placeholder="Enter password"
            autoComplete="current-password"
            showToggle
            aria-label="Password"
            {...register("password")}
            error={errors.password?.message}
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-2 items-center">
              <Checkbox
                id="rememberMe"
                aria-label="Remember me"
                title="Remember me"
                className="translate-y-px"
                {...register("rememberMe")}
              />
              <Label htmlFor="rememberMe" className="leading-none">
                Remember me
              </Label>
            </div>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            variant="default"
            disabled={isPending}
            className="w-full py-6"
          >
            Login
          </Button>
        </form>

        <AuthSocialActions disabled={isPending} />

        <AuthFooterLink
          text="Don't have an account?"
          linkLabel="Register now"
          href={withRedirectQuery("/auth/register", redirect)}
        />
      </div>
    </AuthCard>
  );
}
