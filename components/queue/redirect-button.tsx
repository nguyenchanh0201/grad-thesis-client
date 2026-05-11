"use client";

import { Button } from "@/components/ui/button";
import type { FrontendQueueStatus } from "@/schemas/queue";

type Props = {
  status: FrontendQueueStatus;
  onRedirect: () => void;
  onRejoin: () => void;
};

export function RedirectButton({ status, onRedirect, onRejoin }: Props) {
  const isWaiting = status === "waiting";
  const isNotOpen = status === "not_open";
  const isExpired = status === "expired";
  const canRedirect = status === "ready" || status === "redirecting";

  const handleClick = () => {
    if (isExpired || isNotOpen) onRejoin();
    else if (canRedirect) onRedirect();
  };

  return (
    <Button
      className="mt-4 h-12.5 w-full text-[15px] font-medium"
      disabled={isWaiting}
      variant={isExpired || isNotOpen ? "outline" : "default"}
      onClick={handleClick}
    >
      {isWaiting && "Waiting for your turn..."}
      {canRedirect && "Redirect to ticket purchase page now"}
      {isExpired && "Back to the page"}
      {isNotOpen && "Back to the event page"}
    </Button>
  );
}
