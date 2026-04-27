export const ROLES: Record<string, string> = {
  USER: "Member",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
} as const;
export type Role = "USER" | "ORGANIZER" | "ADMIN" | "SUPER_ADMIN";
