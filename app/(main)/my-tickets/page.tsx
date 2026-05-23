import { redirect } from "next/navigation";

export const metadata = { title: "Ticket & Voucher" };

export default function MyTicketsPage() {
  redirect("/ticket-and-voucher");
}
