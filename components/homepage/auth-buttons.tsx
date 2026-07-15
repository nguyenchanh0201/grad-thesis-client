"use client";

import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { withRedirectQuery } from "@/lib/auth/redirect";

export function AuthButtons() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const currentUrl = query ? `${pathname}?${query}` : pathname;
  const loginHref = withRedirectQuery("/auth/login", currentUrl);
  const registerHref = withRedirectQuery("/auth/register", currentUrl);

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
        <Link href={loginHref}>
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
        <Link href={registerHref}>
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
        <Link href={loginHref}>Log in</Link>
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="hidden lg:inline-flex"
        asChild
      >
        <Link href={registerHref}>Register</Link>
      </Button>
    </div>
  );
}
