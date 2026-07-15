import { AuthLayout } from "@/components/auth/auth-layout";
import { GuestGuard } from "@/components/auth/guest-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <AuthLayout>{children}</AuthLayout>
    </GuestGuard>
  );
}
