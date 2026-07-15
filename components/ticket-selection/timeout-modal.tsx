"use client";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOk?: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  loadingLabel?: string;
};

export function TimeoutModal({
  open,
  onOk,
  isLoading = false,
  title = "Ticket booking timeout",
  description = "You can only complete the ticket booking within a 10-minute time frame. Please rebook.",
  loadingLabel = "Redirecting...",
}: Props) {
  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            <span>{loadingLabel}</span>
          </div>
        ) : (
          <div>
            <Button
              variant="outline"
              onClick={onOk}
              disabled={!onOk}
              className="w-full"
            >
              OK
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
