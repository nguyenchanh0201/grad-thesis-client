"use client";

import { useCurrentUserOrGuest } from "@/hooks/use-current-user";

export function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUserOrGuest();

  if (isLoading) {
    return (
      <div
        data-agent-type="state-display"
        data-entity-type="user-profile"
        data-state-keys="loading"
        className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2"
      >
        <span className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-2 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div
        data-agent-type="state-display"
        data-entity-type="user-profile"
        data-state-keys="error"
        className="rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-muted-foreground"
      >
        Guest mode
      </div>
    );
  }

  return (
    <div
      data-agent-type="state-display"
      data-entity-type="user-profile"
      data-entity-id={user.id}
      data-state-keys="id,role"
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2"
    >
      <div
        data-agent-type="image"
        data-entity-type="user-avatar"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
        aria-hidden="true"
      >
        {user.id.slice(0, 2).toUpperCase()}
      </div>
      <div className="leading-tight">
        <div
          data-agent-type="text"
          data-entity-type="user-name"
          className="text-sm font-medium text-foreground"
        >
          {user.id}
        </div>
        <div
          data-agent-type="label"
          data-entity-type="user-role"
          className="text-xs text-muted-foreground"
        >
          {user.role}
        </div>
      </div>
    </div>
  );
}
