"use client";

import { useState } from "react";
import { ChevronDown, LogOut, Settings, Ticket } from "lucide-react";
import Link from "next/link";

import { useLogout } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/store/auth.store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/services/auth.service";
import { Button } from "../ui/button";

const ROLE_LABELS: Record<AuthUser["role"], string> = {
  USER: "Member",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase();
}

export function UserProfile() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const logout = useLogout();

  if (!user) return null;

  const initials = getInitials(user.email);

  const handleLogout = () => {
    setOpen(false);
    logout.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-1.5 py-6 rounded-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open account menu"
          aria-expanded={open}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary select-none">
            {initials}
          </span>
          <ChevronDown
            className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : undefined }}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="p-0 shadow-lg">
        {/* Account header */}
        <div className="p-4 pt-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <nav className="py-1" aria-label="Account menu">
          <Link
            href="/my-tickets"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
          >
            <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" />
            My Tickets
          </Link>
          <Link
            href="/account/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
          >
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            Account Settings
          </Link>
        </nav>

        <div className="py-1">
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center gap-3 text-sm text-destructive transition-colors hover:bg-destructive/8 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
