"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { InputField } from "@/components/auth/input-field";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { LoginSchema, type LoginInput } from "@/schemas/auth";
import { getAuthErrorMessage } from "@/services/auth.service";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { mutate: login, isPending, error } = useLogin();
  const authError = error ? getAuthErrorMessage(error) : null;

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

        <Separator />
        <p className="text-shadow-muted-foreground text-center">
          Or login with
        </p>
        <GoogleButton disabled={isPending} />

        <AuthFooterLink
          text="Don't have an account?"
          linkLabel="Register now"
          href="/auth/register"
        />
      </div>
    </AuthCard>
  );
}
