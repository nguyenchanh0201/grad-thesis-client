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
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Select payment method
      </h3>
      <PaymentMethodGroup
        methods={methods}
        onChange={onSelect}
        value={selectedId}
      />
    </div>
  );
}
