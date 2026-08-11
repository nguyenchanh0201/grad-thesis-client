"use client";

import { useAuthStore } from "@/lib/store/auth.store";
import { UserProfile } from "@/components/auth/user-profile";
import { AuthButtons } from "./auth-buttons";
import { NotificationBell } from "./notification-bell";

export function NavAuthBar() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex items-center gap-3">
      {isInitialized ? (
        user ? (
          <>
            <NotificationBell userId={user.id} />
            <UserProfile />
          </>
        ) : (
          <AuthButtons />
        )
      ) : null}
    </div>
  );
}
