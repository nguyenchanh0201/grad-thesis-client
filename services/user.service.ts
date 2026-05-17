import type { ProfileUser } from "@/schemas/user";
import { AcCOUNT_TYPES } from "@/schemas/user/account-type";
import { ROLES } from "@/schemas/user/role";
import { getIdentityMe, updateIdentityMe } from "./identity.service";

function mapRole(role: string): ProfileUser["role"] {
  if (role === "ORGANIZER") return ROLES["ORGANIZER"];
  if (role === "ADMIN") return ROLES["ADMIN"];
  if (role === "SUPER_ADMIN") return ROLES["SUPER_ADMIN"];
  return ROLES["USER"];
}

function mapIdentityToProfile(
  identity: Awaited<ReturnType<typeof getIdentityMe>>,
): ProfileUser {
  const user = identity.data.user;
  return {
    name: user.fullName ?? "",
    email: user.email,
    phone: user.phone ?? undefined,
    profilePic: user.organizerProfile?.avatarUrl ?? undefined,
    role: mapRole(user.role),
    accountType:
      user.accountType === AcCOUNT_TYPES.VIP
        ? AcCOUNT_TYPES.VIP
        : AcCOUNT_TYPES.MEMBER,
  };
}

export async function fetchUserProfile(): Promise<ProfileUser> {
  const identity = await getIdentityMe();
  return mapIdentityToProfile(identity);
}

export async function updateUserProfile(
  data: Pick<ProfileUser, "name" | "phone">,
): Promise<ProfileUser> {
  const identity = await updateIdentityMe({
    fullName: data.name.trim(),
    phone: data.phone?.trim() || null,
  });
  return mapIdentityToProfile(identity);
}
