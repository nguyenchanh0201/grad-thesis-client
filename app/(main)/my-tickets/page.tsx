import { AuthGuard } from "@/components/auth/auth-guard";
import { MyTickets } from "@/components/my-tickets";

export const metadata = { title: "My Tickets" };

export default function MyTicketsPage() {
  return (
    <AuthGuard>
      <MyTickets />
    </AuthGuard>
  );
}
