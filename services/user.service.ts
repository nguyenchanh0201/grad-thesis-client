import type { ProfileUser } from "@/schemas/user";
import { ROLES } from "@/schemas/user/role";

// TODO: Delete later
const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

// In-memory mock state — replace with apiClient calls when backend is ready
let _mock: ProfileUser = {
  name: "",
  email: "",
  phone: undefined,
  profilePic: undefined,
  role: ROLES["USER"],
};

export async function fetchUserProfile(): Promise<ProfileUser> {
  await delay(400);
  return { ..._mock };
}

export async function updateUserProfile(
  data: Pick<ProfileUser, "name" | "phone">,
): Promise<ProfileUser> {
  await delay(600);
  _mock = { ..._mock, ...data };
  return { ..._mock };
}

export async function uploadProfilePicture(
  file: File,
): Promise<{ profilePic: string }> {
  await delay(800);
  const url = URL.createObjectURL(file);
  _mock = { ..._mock, profilePic: url };
  return { profilePic: url };
}
