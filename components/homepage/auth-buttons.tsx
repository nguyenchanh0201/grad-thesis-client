"use client";

import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-1">
      {/* Mobile: icon only */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Log in"
        className="lg:hidden"
        asChild
      >
        <Link href="/auth/login">
          <LogIn />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Register"
        className="lg:hidden"
        asChild
      >
        <Link href="/auth/register">
          <UserPlus />
        </Link>
      </Button>

      {/* Desktop: text */}
      <Button
        variant="outline"
        size="lg"
        className="hidden lg:inline-flex"
        asChild
      >
        <Link href="/auth/login">Log in</Link>
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="hidden lg:inline-flex"
        asChild
      >
        <Link href="/auth/register">Register</Link>
      </Button>
    </div>
  );
}
