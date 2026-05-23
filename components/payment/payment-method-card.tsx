"use client";

import { QrCode, CreditCard, Banknote, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod, PaymentMethodId } from "@/schemas/payment";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "../ui/label";

const ICONS: Record<PaymentMethodId, React.ElementType> = {
  vnpay: QrCode,
  mock: CreditCard,
  bank_transfer: Banknote,
  international_card: CreditCard,
  momo: Wallet,
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
      className="grid gap-3"
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
        "group flex w-full cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-4 transition-colors sm:items-center",
        selected ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full transition-colors",
          selected
            ? "bg-white text-foreground"
            : "bg-white text-muted-foreground group-hover:text-foreground",
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-foreground">{method.label}</p>
          {method.id === "vnpay" ? (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs text-muted-foreground">
              Recommended
            </span>
          ) : null}
        </div>
        <p className="line-clamp-none mt-1 text-sm leading-6 text-muted-foreground">
          {method.description}
        </p>
        {method.id === "vnpay" ? (
          <p className="line-clamp-none mt-1 text-xs leading-5 text-muted-foreground">
            Supports bank app QR payment and domestic cards through VNPay.
          </p>
        ) : null}
      </div>
      <RadioGroupItem
        value={method.id}
        id={method.id}
        className="mt-0.5 shrink-0"
      />
    </Label>
  );
}
