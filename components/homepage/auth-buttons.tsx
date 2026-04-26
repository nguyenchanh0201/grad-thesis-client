"use client";

import { Button } from "@/components/ui/button";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="lg">
        Log in
      </Button>
      <Button variant="ghost" size="lg">
        Register
      </Button>
    </div>
  );
}
