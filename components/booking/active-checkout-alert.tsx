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
  checkout,
  isCanceling = false,
  onContinue,
  onCancelAndStartNew,
}: ActiveCheckoutAlertProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={() => {}}
      title="Continue your pending checkout?"
      description={`You still have an active checkout for ${
        checkout?.eventName ?? "another event"
      }. Continue that checkout, or cancel it before starting a new one.`}
      cancelLabel="Cancel and start new"
      cancelLoading={isCanceling}
      cancelLoadingLabel="Canceling..."
      confirmLabel="Continue checkout"
      cancelVariant="destructive"
      confirmDisabled={isCanceling}
      blocking
      onCancel={onCancelAndStartNew}
      onConfirm={onContinue}
    />
  );
}
