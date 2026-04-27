import { Header } from "@/components/homepage/header";

export default function BookingLayout({
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
