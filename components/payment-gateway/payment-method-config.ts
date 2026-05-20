import type { PaymentMethod, PaymentMethodId } from "@/schemas/payment";

const DEFAULT_BANK_NAME =
  process.env.NEXT_PUBLIC_BANK_TRANSFER_BANK_NAME ?? "Vietcombank";
const DEFAULT_ACCOUNT_NUMBER =
  process.env.NEXT_PUBLIC_BANK_TRANSFER_ACCOUNT_NUMBER ?? "0123456789";
const DEFAULT_ACCOUNT_NAME =
  process.env.NEXT_PUBLIC_BANK_TRANSFER_ACCOUNT_NAME ?? "EVENT TICKETING";

export type ManualTransferDetails = {
  recipientName: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  walletName?: string;
  supportedApps: string[];
  transferContent: string;
  note?: string;
};

export type PaymentMethodPresentation = {
  label: string;
  subtitle: string;
  isHostedGateway: boolean;
  details: string;
  actionLabel: string;
  actionBusyLabel: string;
};

export function buildPaymentReference(
  reservationId: string | null,
  invoiceId: string,
) {
  if (reservationId) return `BOOK ${reservationId}`;
  return `BOOK ${invoiceId.slice(-10)}`;
}

export function getPaymentMethodPresentation(
  methodId: PaymentMethodId | null,
  selectedMethod?: PaymentMethod,
): PaymentMethodPresentation {
  const checkoutType = selectedMethod?.checkoutConfig?.type;
  const isHostedGateway =
    checkoutType === "hosted_gateway"
      ? true
      : checkoutType === "manual_transfer" || checkoutType === "wallet"
        ? false
        : methodId === "vnpay" || methodId === "international_card";

  switch (methodId) {
    case "bank_transfer":
      return {
        label: selectedMethod?.label ?? "Bank Transfer",
        subtitle: "Scan QR or transfer manually via banking app",
        isHostedGateway,
        details:
          "Complete the transfer using the exact amount and transfer reference below.",
        actionLabel: "Waiting for transfer",
        actionBusyLabel: "Waiting for transfer",
      };
    case "momo":
      return {
        label: selectedMethod?.label ?? "MoMo Wallet",
        subtitle: "Scan QR from wallet app or transfer manually",
        isHostedGateway,
        details:
          "Open your wallet app, scan the QR, and keep the payment reference unchanged.",
        actionLabel: "Waiting for transfer",
        actionBusyLabel: "Waiting for transfer",
      };
    case "international_card":
      return {
        label: selectedMethod?.label ?? "International Card",
        subtitle: "Continue to payment gateway to enter card details",
        isHostedGateway,
        details:
          "You will be redirected to the gateway page to complete card authentication.",
        actionLabel: "Continue to payment gateway",
        actionBusyLabel: "Redirecting...",
      };
    case "vnpay":
    default:
      return {
        label: selectedMethod?.label ?? "VNPay",
        subtitle: "Hosted checkout with QR, ATM, and wallet options",
        isHostedGateway,
        details:
          "Payment status will be updated automatically after provider confirmation.",
        actionLabel: "Waiting for provider confirmation",
        actionBusyLabel: "Waiting for provider confirmation",
      };
  }
}

function applyTemplate(
  value: string | undefined,
  context: {
    reservationId: string | null;
    paymentReference: string;
    methodLabel: string;
    totalAmount: number;
  },
) {
  if (!value) return undefined;
  return value
    .replaceAll("{reservationId}", context.reservationId ?? "")
    .replaceAll("{paymentReference}", context.paymentReference)
    .replaceAll("{methodLabel}", context.methodLabel)
    .replaceAll("{amount}", `${Math.max(0, Math.round(context.totalAmount))}`);
}

export function getManualTransferDetails(
  methodId: PaymentMethodId | null,
  method: PaymentMethod | undefined,
  reservationId: string | null,
  methodLabel: string,
  paymentReference: string,
  totalAmount: number,
): ManualTransferDetails {
  const checkoutConfig = method?.checkoutConfig;
  const resolvedTransferContent =
    applyTemplate(checkoutConfig?.transferContentTemplate, {
      reservationId,
      paymentReference,
      methodLabel,
      totalAmount,
    }) ?? `${methodLabel} ${paymentReference}`;

  return {
    recipientName:
      checkoutConfig?.recipientName ??
      checkoutConfig?.accountName ??
      DEFAULT_ACCOUNT_NAME,
    bankName:
      checkoutConfig?.bankName ??
      (methodId === "momo" ? "MoMo Wallet" : DEFAULT_BANK_NAME),
    accountNumber: checkoutConfig?.accountNumber ?? DEFAULT_ACCOUNT_NUMBER,
    accountName: checkoutConfig?.accountName ?? DEFAULT_ACCOUNT_NAME,
    walletName: checkoutConfig?.walletName,
    supportedApps: checkoutConfig?.supportedApps ?? [],
    transferContent: resolvedTransferContent,
    note: checkoutConfig?.note,
  };
}

export function buildTransferQrValue(
  method: PaymentMethod | undefined,
  reservationId: string | null,
  paymentReference: string,
  totalAmount: number,
  transfer: ManualTransferDetails,
) {
  const qrPayload = applyTemplate(method?.checkoutConfig?.qrPayload, {
    reservationId,
    paymentReference,
    methodLabel: method?.label ?? "Payment",
    totalAmount,
  });

  if (qrPayload) {
    return qrPayload;
  }

  return [
    `RECEIVER:${transfer.recipientName}`,
    `BANK:${transfer.bankName}`,
    `ACCOUNT:${transfer.accountNumber}`,
    `NAME:${transfer.accountName}`,
    `AMOUNT:${Math.max(0, Math.round(totalAmount))}`,
    "CURRENCY:VND",
    `CONTENT:${transfer.transferContent}`,
  ].join("\n");
}
