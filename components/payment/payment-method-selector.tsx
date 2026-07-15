"use client";

import type { PaymentMethod, PaymentMethodId } from "@/schemas/payment";
import { PaymentMethodGroup } from "./payment-method-card";

type Props = {
  methods: PaymentMethod[];
  selectedId?: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
};

export function PaymentMethodSelector({
  methods,
  selectedId,
  onSelect,
}: Props) {
  const hasMethods = methods.length > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Payment method
        </p>
        <h3 className="line-clamp-none text-base font-medium text-foreground">
          Choose how you want to pay
        </h3>
        <p className="line-clamp-none text-sm leading-6 text-muted-foreground">
          Select one available method. You will review the final order before
          the gateway processes the payment.
        </p>
      </div>
      {hasMethods ? (
        <PaymentMethodGroup
          methods={methods}
          onChange={onSelect}
          value={selectedId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No payment methods are available for this event right now.
        </p>
      )}
    </div>
  );
}
