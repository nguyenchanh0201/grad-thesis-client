"use client";

import { AlertDialog } from "@/components/ui/alert-dialog";
import type { ActiveCheckoutReservation } from "@/schemas/reservation";

type ActiveCheckoutAlertProps = {
  open: boolean;
  checkout: ActiveCheckoutReservation | null;
  isCanceling?: boolean;
  onContinue: () => void;
  onCancelAndStartNew: () => void;
};

export function ActiveCheckoutAlert({
  open,
  isCanceling = false,
  onContinue,
  onCancelAndStartNew,
}: ActiveCheckoutAlertProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={() => {}}
      title="Active checkout found"
      description="You have an unfinished checkout. Continue it or cancel it to start a new one."
      cancelLabel="Cancel checkout"
      cancelLoading={isCanceling}
      cancelLoadingLabel="Canceling..."
      confirmLabel="Continue"
      cancelVariant="destructive"
      confirmDisabled={isCanceling}
      blocking
      onCancel={onCancelAndStartNew}
      onConfirm={onContinue}
    />
  );
}
