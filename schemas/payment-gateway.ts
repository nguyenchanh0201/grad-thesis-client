export type GatewaySession = {
  invoiceId: string;
  paymentDeadline: Date;
  totalAmount: number;
  currency: "VND";
  lineItems: GatewayLineItem[];
};

export type GatewayLineItem = {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type VNPayResultParams = {
  vnp_ResponseCode?: string;
  vnp_TxnRef?: string;
  vnp_Amount?: string;
  vnp_TransactionNo?: string;
  vnp_PayDate?: string;
  vnp_OrderInfo?: string;
  // mock mode
  mock?: string;
  invoiceId?: string;
  amount?: string;
};
