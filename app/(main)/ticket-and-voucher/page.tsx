import { AuthGuard } from "@/components/auth/auth-guard";
import { TicketAndVoucher } from "@/components/ticket-and-voucher";

export const metadata = { title: "Ticket & Voucher" };

export default function TicketAndVoucherPage() {
  return (
    <AuthGuard>
      <TicketAndVoucher />
    </AuthGuard>
  );
}
