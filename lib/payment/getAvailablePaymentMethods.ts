import type { PaymentMethod, PaymentMethodId } from "@/schemas/payment";

export type EventPaymentConfig = {
  allowedMethods: PaymentMethodId[];
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "vnpay",
    providerCode: "vnpay",
    label: "VNPay",
    description: "Scan QR code, pay instantly via VNPay",
    iconKey: "qr-code",
    enabled: true,
    sortOrder: 10,
  },
  // Future methods — set enabled: true and add to eventConfig.allowedMethods to activate
  // { id: "international_card", label: "International payment card", description: "Fill in additional information, smart security", iconKey: "credit-card", enabled: false },
  // { id: "bank_transfer", label: "Bank Transfer", description: "Scan code instantly, confirm order immediately", iconKey: "bank", enabled: false },
];

export const DEFAULT_EVENT_PAYMENT_CONFIG: EventPaymentConfig = {
  allowedMethods: ["vnpay"],
};

export function getAvailablePaymentMethods(
  config: EventPaymentConfig = DEFAULT_EVENT_PAYMENT_CONFIG,
): PaymentMethod[] {
  return PAYMENT_METHODS.filter(
    (m) => m.enabled && config.allowedMethods.includes(m.id),
  );
}
