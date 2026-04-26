import type { FrontendQueueStatus } from "@/schemas/queue";

type Props = { status: FrontendQueueStatus };

const MESSAGE: Record<FrontendQueueStatus, string> = {
  not_open: "The queue for this event is not yet open.",
  waiting: "Thank you for joining the event waiting room",
  ready: "Your turn is ready! Redirecting you now...",
  redirecting: "Your turn is ready! Redirecting you now...",
  expired: "Your session has expired. Please rejoin the queue.",
};

export function QueueStatusMessage({ status }: Props) {
  return (
    <p className="pt-4 text-[13px] font-normal text-muted-foreground">
      {MESSAGE[status]}
    </p>
  );
}
