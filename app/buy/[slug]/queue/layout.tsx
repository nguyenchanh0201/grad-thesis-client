import { Header } from "@/components/homepage/header";

export default function QueueLayout({
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
