import { Loader2 } from "lucide-react";

import type { FrontendQueueStatus } from "@/schemas/queue";

type Props = {
  status: FrontendQueueStatus;
  countdown: number;
  position?: number | null;
  queueSize?: number | null;
};

export function CountdownBar({
  status,
  countdown,
  position,
  queueSize,
}: Props) {
  return (
    <div className="mt-4 rounded-lg bg-muted px-4.5 py-3.5 text-sm">
      {status === "waiting" ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 shrink-0 animate-spin" />
          {position != null ? (
            <span>
              You are <strong className="text-foreground">#{position}</strong>{" "}
              in line
              {queueSize != null && (
                <>
                  {" "}
                  - <strong className="text-foreground">
                    {queueSize}
                  </strong>{" "}
                  total in queue
                </>
              )}
            </span>
          ) : (
            <span>Please wait, preparing your session...</span>
          )}
        </div>
      ) : status === "not_open" ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 shrink-0 animate-spin" />
          <span>Please wait, preparing your session...</span>
        </div>
      ) : status === "redirecting" || status === "ready" ? (
        <span className="text-foreground">
          Automatically redirecting to ticket purchase page in{" "}
          <strong>{countdown}s</strong>
        </span>
      ) : (
        <span className="text-muted-foreground">
          Your queue session has expired.
        </span>
      )}
    </div>
  );
}
