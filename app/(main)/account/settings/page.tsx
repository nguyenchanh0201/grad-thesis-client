import { AuthGuard } from "@/components/auth/auth-guard";
import { ProfileSettings } from "@/components/account/profile-settings";

export const metadata = { title: "Account Settings" };

export default function AccountSettingsPage() {
  return (
    <AuthGuard>
      <ProfileSettings />
    </AuthGuard>
  );
}
