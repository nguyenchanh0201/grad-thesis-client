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
      <BuyProcessShell>{children}</BuyProcessShell>
    </>
  );
}
