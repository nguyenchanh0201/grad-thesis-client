import { cn } from "@/lib/utils";
import type { FrontendQueueStatus } from "@/schemas/queue";

type Props = {
  status: FrontendQueueStatus;
  bookingMinutes?: number;
  paymentMinutes?: number;
};

export function QueueInstructions({
  status,
  bookingMinutes = 10,
  paymentMinutes = 10,
}: Props) {
  const hidden = status === "expired" || status === "not_open";

  return (
    <p
      className={cn(
        "text-[14px] leading-relaxed text-foreground/80 line-clamp-none",
        hidden && "invisible",
      )}
      aria-hidden={hidden}
    >
      You have <strong>{bookingMinutes} minutes</strong> to book your ticket and
      another <strong>{paymentMinutes} minutes</strong> to complete your
      payment. Please note not to exit or refresh the page, as doing so will
      result in losing your place in the ticket queue. TicketGo appreciates your
      patience!
    </p>
  );
}
