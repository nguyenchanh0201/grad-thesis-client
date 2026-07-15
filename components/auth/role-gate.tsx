"use client";

import type { ReactNode } from "react";

import type { CurrentUser } from "@/schemas/api";

const DEFAULT_ALLOWED_ROLES: CurrentUser["role"][] = [
  "ORGANIZER",
  "ADMIN",
  "SUPER_ADMIN",
];

type RoleGateProps = {
  userRole?: CurrentUser["role"] | null;
  allowedRoles?: CurrentUser["role"][];
  children: ReactNode;
  fallback?: ReactNode;
};

export function RoleGate({
  userRole,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
  children,
  fallback = null,
}: RoleGateProps) {
  const isAllowed = Boolean(userRole && allowedRoles.includes(userRole));

  return (
    <>
      <div
        data-agent-type="state-display"
        data-entity-type="permission-gate"
        data-state-keys="userRole,allowedRoles,isAllowed"
        data-permission-required={allowedRoles.join("|")}
        hidden
      />
      {isAllowed ? children : fallback}
    </>
  );
}
