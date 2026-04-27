"use client";

import { QrCode, CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod, PaymentMethodId } from "@/schemas/payment";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "../ui/label";

const ICONS: Record<PaymentMethodId, React.ElementType> = {
  vnpay: QrCode,
  bank_transfer: Banknote,
  international_card: CreditCard,
};

type Props = {
  methods: PaymentMethod[];
  value?: string;
  onChange: (value: PaymentMethodId) => void;
};

export function PaymentMethodGroup({ methods, value, onChange }: Props) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(val) => onChange(val as PaymentMethodId)}
      className="flex flex-col gap-2"
    >
      {methods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          selected={value === method.id}
        />
      ))}
    </RadioGroup>
  );
}

type CardProps = {
  method: PaymentMethod;
  selected: boolean;
};

function PaymentMethodCard({ method, selected }: CardProps) {
  const Icon = ICONS[method.id] ?? CreditCard;

  return (
    <Label
      htmlFor={method.id}
      className={cn(
        "flex w-full items-center gap-3 rounded-sm border p-4 cursor-pointer transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/40",
      )}
    >
      <Icon className="w-10 h-10 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{method.label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {method.description}
        </p>
      </div>
      <RadioGroupItem
        value={method.id}
        id={method.id}
        className="mt-0.5 shrink-0"
      />
    </Label>
  );
}
