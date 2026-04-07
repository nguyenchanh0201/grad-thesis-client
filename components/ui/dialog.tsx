import * as React from "react";

import { cn } from "@/lib/utils";

type DialogProps = React.ComponentProps<"dialog">;

function Dialog({ className, ...props }: DialogProps) {
  return (
    <dialog
      data-agent-type="state-display"
      data-entity-type="ui-dialog"
      data-slot="dialog"
      className={cn(
        "w-full max-w-lg rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-background/70",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-content"
      className={cn("space-y-4 p-5", className)}
      {...props}
    />
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("space-y-1", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-base font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
