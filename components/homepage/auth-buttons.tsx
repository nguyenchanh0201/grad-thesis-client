"use client";

import { LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Log in"
        className="lg:hidden"
      >
        <LogIn />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Register"
        className="lg:hidden"
      >
        <UserPlus />
      </Button>

      {/* lg+: text */}
      <Button variant="outline" size="lg" className="hidden lg:inline-flex">
        Log in
      </Button>
      <Button variant="ghost" size="lg" className="hidden lg:inline-flex">
        Register
      </Button>
    </div>
  );
}
