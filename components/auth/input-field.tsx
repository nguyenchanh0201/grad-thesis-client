"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const ICON_MAP = { mail: Mail, lock: Lock } as const;

interface InputFieldProps extends Omit<ComponentProps<"input">, "type"> {
  type: "email" | "password" | "text";
  icon?: keyof typeof ICON_MAP;
  showToggle?: boolean;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ type, icon, showToggle, error, className, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const Icon = icon ? ICON_MAP[icon] : null;
    const resolvedType =
      type === "password" ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full space-y-1.5">
        <div className="relative w-full">
          {Icon && (
            <Icon
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10"
              aria-hidden="true"
            />
          )}
          <Input
            ref={ref}
            id={id}
            type={resolvedType}
            className={cn(
              "h-auto rounded-[10px] bg-muted border-transparent py-3.5 shadow-none",
              "focus-visible:bg-background",
              Icon ? "pl-10" : "",
              showToggle ? "pr-11" : "",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error && id ? `${id}-error` : undefined}
            {...props}
          />
          {showToggle && type === "password" && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {error && id && (
          <p
            id={`${id}-error`}
            className="text-xs text-destructive"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";
