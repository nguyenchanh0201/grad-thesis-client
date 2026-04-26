import { Header } from "@/components/homepage/header";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header hideSearchBar />
      {children}
    </>
  );
}
