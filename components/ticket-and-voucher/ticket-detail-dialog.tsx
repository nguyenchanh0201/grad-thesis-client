"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { fmt } from "@/lib/strings/money";
import { BackendTicket, BackendTicketStatus } from "@/schemas/ticket";

const STATUS_CONFIG: Record<
  BackendTicketStatus,
  {
    label: string;
    variant: "success" | "warning" | "secondary" | "destructive";
  }
> = {
  [BackendTicketStatus.VALID]: { label: "Valid", variant: "success" },
  [BackendTicketStatus.USED]: { label: "Used", variant: "secondary" },
  [BackendTicketStatus.CANCELLED]: {
    label: "Cancelled",
    variant: "destructive",
  },
  [BackendTicketStatus.TRANSFERRED]: {
    label: "Transferred",
    variant: "warning",
  },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tickets: BackendTicket[] | null;
};

function formatDateTime(value: string): string {
  const date = new Date(value);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketDetailDialog({ open, onOpenChange, tickets }: Props) {
  if (!tickets?.length) {
    return null;
  }

  const event = tickets[0].event;
  const order = tickets[0].order;
  const currency = tickets[0].ticketType.currency;
  const total = tickets.reduce(
    (sum, ticket) => sum + Number(ticket.ticketType.price),
    0,
  );
  const eventDate = formatDateTime(event.eventDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="line-clamp-2 pr-8">
            {event.eventName}
          </DialogTitle>
          <DialogDescription>
            {order ? `${order.orderNumber} - ` : ""}
            {eventDate} at {event.venue.venueName}
            {event.venue.city ? `, ${event.venue.city}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <section className="space-y-2">
            <DetailRow label="Ticket count" value={String(tickets.length)} />
            <DetailRow
              label="Total"
              value={`${fmt(total)} ${currency}`}
              strong
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Ticket details
            </p>
            <div className="space-y-2">
              {tickets.map((ticket) => {
                const status = STATUS_CONFIG[ticket.status];
                const seat = ticket.seat
                  ? `Row ${ticket.seat.row}, Seat ${ticket.seat.column}`
                  : "General admission";

                return (
                  <div
                    key={ticket.id}
                    className="space-y-3 rounded-sm border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{ticket.ticketType.name}</p>
                        <p className="text-xs text-muted-foreground">{seat}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    <div className="space-y-1">
                      <DetailRow label="Ticket code" value={ticket.code} mono />
                      <DetailRow
                        label="Price"
                        value={`${fmt(ticket.ticketType.price)} ${ticket.ticketType.currency}`}
                      />
                      {ticket.checkedInAt && (
                        <DetailRow
                          label="Checked in"
                          value={formatDateTime(ticket.checkedInAt)}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
  mono = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  const valueClassName = [
    "text-right",
    strong ? "font-semibold" : "",
    mono ? "font-mono text-xs" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClassName}>{value}</span>
    </div>
  );
}
