import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "@/components/homepage/header";
import { BuyProcessShell } from "@/components/buy-process/buy-process-shell";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header hideSearchBar />
      <AuthGuard>
        <BuyProcessShell>{children}</BuyProcessShell>
      </AuthGuard>
    </>
  );
}
