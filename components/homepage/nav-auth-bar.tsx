"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import { UserProfile } from "@/components/auth/user-profile";
import { AuthButtons } from "./auth-buttons";
import { LangSelector } from "./lang-selector";

export function NavAuthBar() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex items-center gap-3">
      {isInitialized ? user ? <UserProfile /> : <AuthButtons /> : null}
      <span className="w-px h-6 bg-border" />
      <LangSelector />
    </div>
  );
}
