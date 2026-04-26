"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { InputField } from "@/components/auth/input-field";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { LoginSchema, type LoginInput } from "@/schemas/auth";
import { login, getAuthErrorMessage } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);
    try {
      await login(data);
      router.push("/");
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    }
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
            disabled={isSubmitting}
            className="w-full py-6 rounded-xl"
          >
            Login
          </Button>
        </form>

        <Separator />
        <p className="text-shadow-muted-foreground text-center">
          Or login with
        </p>
        <GoogleButton disabled={isSubmitting} />

        <AuthFooterLink
          text="Don't have an account?"
          linkLabel="Register now"
          href="/auth/register"
        />
      </div>
    </AuthCard>
  );
}
