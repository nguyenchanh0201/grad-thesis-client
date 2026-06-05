"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  cancelVariant?: ComponentProps<typeof Button>["variant"];
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  confirmLoading?: boolean;
  cancelLoading?: boolean;
  confirmLoadingLabel?: string;
  cancelLoadingLabel?: string;
  blocking?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  cancelVariant = "outline",
  confirmDisabled = false,
  cancelDisabled = false,
  confirmLoading = false,
  cancelLoading = false,
  confirmLoadingLabel = "Loading...",
  cancelLoadingLabel = "Loading...",
  blocking = false,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (blocking && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={
          blocking ? (event) => event.preventDefault() : undefined
        }
        onPointerDownOutside={
          blocking ? (event) => event.preventDefault() : undefined
        }
        onInteractOutside={
          blocking ? (event) => event.preventDefault() : undefined
        }
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="-mx-4 -mb-4 mt-2 sm:justify-end">
          <Button
            variant={cancelVariant}
            onClick={handleCancel}
            disabled={cancelDisabled || cancelLoading}
          >
            {cancelLoading ? cancelLoadingLabel : cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLoading ? confirmLoadingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
